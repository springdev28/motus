-- Permission smoke test. All synthetic fixtures are rolled back, including on failure.
-- Run against the dedicated Motus project as postgres, never against Schoolar or Casparel.
begin;
insert into auth.users (id, email) values
 ('10000000-0000-4000-8000-000000000001','motus-test-a@example.invalid'),
 ('10000000-0000-4000-8000-000000000002','motus-test-b@example.invalid');
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"10000000-0000-4000-8000-000000000001","role":"authenticated"}',true);
insert into public.profiles(id,handle,display_name) values ('10000000-0000-4000-8000-000000000001','motus_test_a','Test A');
do $$ begin
 begin
  insert into public.profiles(id,handle,display_name) values ('10000000-0000-4000-8000-000000000002','spoofed_test_b','Spoofed');
  raise exception 'FAIL: profile ownership was not enforced';
 exception when insufficient_privilege then null;
 end;
end $$;
insert into public.communities(id,slug,name,owner_id) values ('20000000-0000-4000-8000-000000000001','motus_test_group','Test community','10000000-0000-4000-8000-000000000001');
insert into public.works(id,owner_id,title,author,language,rating,status,format,page_count,edition_path,published) values
 ('30000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','Private test','Test A','English','General','Ongoing','page',1,'10000000-0000-4000-8000-000000000001/draft.json',false),
 ('30000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000001','Public test','Test A','English','General','Ongoing','page',1,'10000000-0000-4000-8000-000000000001/public.json',true);
insert into public.reading_preferences(user_id,settings) values ('10000000-0000-4000-8000-000000000001','{"motion":false}');
insert into storage.objects(bucket_id,name) values ('comic-editions','10000000-0000-4000-8000-000000000001/draft.json'),('comic-editions','10000000-0000-4000-8000-000000000001/public.json');
select set_config('request.jwt.claims','{"sub":"10000000-0000-4000-8000-000000000002","role":"authenticated"}',true);
insert into public.profiles(id,handle,display_name) values ('10000000-0000-4000-8000-000000000002','motus_test_b','Test B');
do $$ declare affected integer; begin
 if exists(select 1 from public.works where id='30000000-0000-4000-8000-000000000001') then raise exception 'FAIL: another account can read a private work'; end if;
 if exists(select 1 from public.reading_preferences where user_id='10000000-0000-4000-8000-000000000001') then raise exception 'FAIL: private preferences leaked'; end if;
 if exists(select 1 from storage.objects where name='10000000-0000-4000-8000-000000000001/draft.json') then raise exception 'FAIL: private edition leaked'; end if;
 update public.works set title='Changed' where id='30000000-0000-4000-8000-000000000002';
 get diagnostics affected = row_count;
 if affected <> 0 then raise exception 'FAIL: another account can edit a work'; end if;
 update public.communities set name='Changed' where id='20000000-0000-4000-8000-000000000001';
 get diagnostics affected = row_count;
 if affected <> 0 then raise exception 'FAIL: another account can edit a community'; end if;
 begin
  insert into storage.objects(bucket_id,name) values ('comic-editions','10000000-0000-4000-8000-000000000001/foreign.json');
  raise exception 'FAIL: upload into another account folder allowed';
 exception when insufficient_privilege then null;
 end;
 begin
  insert into public.works(id,owner_id,title,author,language,rating,status,format,page_count,edition_path,community_id) values ('30000000-0000-4000-8000-000000000003','10000000-0000-4000-8000-000000000002','Foreign group','Test B','English','General','Ongoing','page',1,'10000000-0000-4000-8000-000000000002/work.json','20000000-0000-4000-8000-000000000001');
  raise exception 'FAIL: posting to an unjoined community allowed';
 exception when insufficient_privilege then null;
 end;
end $$;
insert into public.community_members(community_id,user_id) values ('20000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000002');
insert into public.works(id,owner_id,title,author,language,rating,status,format,page_count,edition_path,community_id,published) values ('30000000-0000-4000-8000-000000000003','10000000-0000-4000-8000-000000000002','Joined group','Test B','English','General','Ongoing','page',1,'10000000-0000-4000-8000-000000000002/work.json','20000000-0000-4000-8000-000000000001',true);
delete from public.community_members where community_id='20000000-0000-4000-8000-000000000001' and user_id='10000000-0000-4000-8000-000000000002';
update public.works set published=false,community_id=null where id='30000000-0000-4000-8000-000000000003';
insert into public.bookmarks(user_id,work_id) values ('10000000-0000-4000-8000-000000000002','30000000-0000-4000-8000-000000000002');
insert into public.creator_follows(user_id,creator_id) values ('10000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000001');
insert into public.content_reports(reporter_id,work_id,reason) values ('10000000-0000-4000-8000-000000000002','30000000-0000-4000-8000-000000000002','Synthetic test report only.');
reset role;
set local role anon;
select set_config('request.jwt.claims','{"role":"anon"}',true);
do $$ begin
 if (select count(*) from public.works where id in ('30000000-0000-4000-8000-000000000001','30000000-0000-4000-8000-000000000002','30000000-0000-4000-8000-000000000003')) <> 1 then raise exception 'FAIL: public work visibility incorrect'; end if;
 if (select count(*) from storage.objects where bucket_id='comic-editions') <> 1 then raise exception 'FAIL: public storage visibility incorrect'; end if;
 begin
  insert into public.profiles(id,handle,display_name) values ('10000000-0000-4000-8000-000000000003','anonymous_test','Anonymous');
  raise exception 'FAIL: anonymous profile write allowed';
 exception when insufficient_privilege then null;
 end;
end $$;
reset role;
rollback;
select 'PASS: ownership, private drafts/preferences/storage, community membership, public reading and anonymous write restrictions; all fixtures rolled back.' as result;
