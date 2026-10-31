# SETUP ENVIRONEMENT

## ENV

Before starting , please create the enverimental var (in `.env`) or you can check the `.env.example`:

```env
# For Example :
DB_HOST="localhost"
DB_NAME="the_db_name"
DB_USER="user_name"
DB_PASSWORD="1234"
```

## Database

You also need to set the database , please see the
`database/database.sql` and set it :

```bash
# ------ THAT DEPEND OF YOUR SYSTEM (That command is on Linux
mysql -u user_name -p the_db_name < database/database.sql
```
