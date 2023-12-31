import hashlib

from django.db import connection


def create_github_calendar_table(github_id):
    github_id = github_id.lower().replace('-', '_')
    table_name = f'tech_stack_githubcalendar_{github_id}'

    # Calculate the SHA-256 hash
    sha256_hash = hashlib.sha256(github_id.encode()).hexdigest()
    truncated_hash = sha256_hash[:8]

    with connection.cursor() as cursor:
        query = f"SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = '{table_name}')"
        cursor.execute(query)
        is_exist = cursor.fetchone()[0]
        if not is_exist:
            create_table_query = (
                f"""
                create table {table_name}
                (
                    id           bigint generated by default as identity primary key,
                    author_date  timestamp with time zone not null,
                    tech_name    varchar(50)              not null,
                    lines        integer                  not null,
                    repo_url     varchar(150),
                    commit_hash  varchar(150),
                    github_id_id varchar(100)
                    constraint tech_stack_githubcal_github_id_id_{truncated_hash}_fk_tech_stac
                    references tech_stack_githubuser
                    deferrable initially deferred
                );
                alter table {table_name} owner to linuxgeek;
                """
            )
            cursor.execute(create_table_query)
            print(f"Table '{table_name}' created successfully.")
