# TaskManager

## ENV

Before starting , please create the enverimental var (in `.env`) or you can check the `.env.example`:

```
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

## API DOC

### 0. Get /test

It's just a test to check if everything is OK

### 1. POST /auth

#### /signup

`Lien : http://env.DB_HOST/auth/signup`

Headers : Content-Type: application/json

```json
// SEND
{
  "nom": "Alice",
  "email": "alice@example.com",
  "password": "alice123"
}
```

#### /login

`Lien : http://env.DB_HOST/auth/login`

Headers : Content-Type: application/json

```json
// SEND
{
  "email": "alice@example.com",
  "password": "alice123"
}
```
