# TaskManager

## API DOC

### POST /auth/login

`Lien : http://localhost:8000/auth/login`

Headers : Content-Type: application/json

```json
// À envoyer (request)
{
  "email": "alice@example.com",
  "password": "alice123"
}
```

```json
// À recevoir (response)
{
  "email": "alice@example.com",
  "password": "alice123"
}
```
