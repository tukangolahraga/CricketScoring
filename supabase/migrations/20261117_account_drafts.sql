
create or replace function public.cpl_save_account_draft(p_actor uuid,p_local_key text,p_expected bigint,p_request uuid,p_hash text,p_payload jsonb)
returns jsonb language plpgsql set search_path='' as $$
declare rec public.cpl_match_snapshots; req cpl_private.write_requests; result jsonb; mid uuid; newrev bigint;
begin
 if p_actor is null or p_local_key is null or char_length(p_local_key) not between 1 and 120 or p_expected is null or p_expected<0 or p_request is null or p_hash is null or p_hash !~ '^[a-f0-9]{64}$' or jsonb_typeof(p_payload) is distinct from 'object' then raise exception 'INVALID_DRAFT'; end if;
 if not exists(select 1 from auth.users where id=p_actor and email_confirmed_at is not null and not coalesce(is_anonymous,false)) then raise exception 'LOGIN_REQUIRED'; end if;
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_actor::text||':'||p_local_key,0));
 select * into req from cpl_private.write_requests where owner_id=p_actor and request_id=p_request;
 if found then
  if req.body_sha256<>p_hash then raise exception 'REQUEST_ID_REUSED'; end if;
  return req.response;
 end if;
 select * into rec from public.cpl_match_snapshots where owner_id=p_actor and local_match_key=p_local_key for update;
 if coalesce(rec.revision,0)<>p_expected then raise exception 'CONFLICT: revision %',coalesce(rec.revision,0); end if;
 if rec.id is null then
  insert into public.cpl_match_snapshots(owner_id,local_match_key,payload,payload_sha256) values(p_actor,p_local_key,p_payload,p_hash) returning id,revision into mid,newrev;
 else
  update public.cpl_match_snapshots set payload=p_payload,payload_sha256=p_hash,revision=revision+1,updated_at=now() where id=rec.id returning id,revision into mid,newrev;
 end if;
 result=jsonb_build_object('id',mid,'revision',newrev,'published',false,'savedAt',now());
 insert into cpl_private.write_requests(owner_id,request_id,body_sha256,response) values(p_actor,p_request,p_hash,result);
 return result;
end $$;
revoke all on function public.cpl_save_account_draft(uuid,text,bigint,uuid,text,jsonb) from public,anon,authenticated;
grant execute on function public.cpl_save_account_draft(uuid,text,bigint,uuid,text,jsonb) to service_role;
