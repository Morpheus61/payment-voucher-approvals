-- Create users table
create table public.users (
    id uuid references auth.users on delete cascade,
    email text not null,
    full_name text,
    mobile text,
    role text not null check (role in ('admin', 'approver', 'requester')),
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
    primary key (id)
);

-- Enable RLS
alter table public.users enable row level security;

-- Create policies
create policy "Users can view their own data" on users
    for select using (auth.uid() = id);

create policy "Admin can view all data" on users
    for select using (
        exists (
            select 1 from users
            where users.id = auth.uid()
            and users.role = 'admin'
        )
    );

create policy "Admin can insert data" on users
    for insert with check (
        exists (
            select 1 from users
            where users.id = auth.uid()
            and users.role = 'admin'
        )
    );

create policy "Admin can update data" on users
    for update using (
        exists (
            select 1 from users
            where users.id = auth.uid()
            and users.role = 'admin'
        )
    );

-- Create function to handle user creation
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
    insert into public.users (id, email, role)
    values (new.id, new.email, 'requester');
    return new;
end;
$$;

-- Create trigger for new user creation
create trigger on_auth_user_created
    after insert on auth.users
    for each row execute procedure public.handle_new_user();
