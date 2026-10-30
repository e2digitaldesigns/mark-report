-- Back-office controls for the public "send news tips" form:
-- turn it on/off and choose where it appears.
alter table public.site_settings
  add column if not exists show_tip_form boolean not null default true,
  add column if not exists tip_form_position text not null default 'bottom'
    check (tip_form_position in ('bottom', 'col1', 'col2', 'col3'));

notify pgrst, 'reload schema';
