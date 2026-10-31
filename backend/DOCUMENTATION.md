# API DOC

## 0. Get /test

It's just a test to check if everything is OK

## 1. POST /auth

### /signup

`Lien : http://env.DB_HOST/auth/signup`

Headers : Content-Type: application/json

```json
// SEND
{
  "nom_utilisateur": "Alice",
  "email": "alice@example.com",
  "mot_de_passe": "alice123"
}
```

### /login

`Lien : http://env.DB_HOST/auth/login`

Headers : Content-Type: application/json

```json
// SEND
{
  "email": "alice@example.com",
  "mot_de_passe": "alice123"
}
```

## 2. GET /info

### /tag

`Lien : http://env.DB_HOST/info/tag`
Need session to get the user id
Headers : Content-Type: application/json

```json
// RECEIVE
{
"message":"the message",
"data":[
    {
        "tag_id":1,
        "tag_name":"Frontend",
    }
   ]
}
```

### /individu

`Lien : http://env.DB_HOST/info/individu`
Need session to get the user id
Headers : Content-Type: application/json

```json
// RECEIVE
{
"message":"the message",
"data":[
    {
        "individu_id":1,
        "individu_name":"Frontend",
    }
   ]
}
}
```

### /competence

`Lien : http://env.DB_HOST/info/competence`
Don't Need session , no need user id , that get the all competence
Headers : Content-Type: application/json

```json
// RECEIVE
{
"message":"the message",
"data":[
    {
        "competence_id":1,
        "competence_name":"Frontend",
    }
   ]
}
}
```

## 3. POST /upload

### /project

`Lien : http://env.DB_HOST/upload/project`
Need session to get the user id
Headers : Content-Type: application/json

```json
// RECEIVE
{
"message":"The message"
}
```

```json
// SEND
{
"project_name":"projet PHP",
"project_description":"Very long project",
"deadline":"10-12-2026",
// Optional 
"project_status":"not finished", // Default en not finished but it can be finished or failed
"project_time_creation":"15-09-2026",//Defaut to now
}
```

### /individu

`Lien : http://env.DB_HOST/upload/individu`
Need session to get the user id
Headers : Content-Type: application/json

```json
// RECEIVE
{
"message":"The message",
}
```

```json
// SEND
{
"individu_name":"Patrick",
// Opptionnel
"individu_profil_image":"http://test.com/image.jpg",// Par defaut une image predefinie
}
```

### /tache

`Lien : http://env.DB_HOST/upload/tache`
Need session to get the user id
Headers : Content-Type: application/json

```json
// RECEIVE
{
"message":"The message",
}
```

```json
// SEND
{
"activity_id":1,
"individu_id":1,
// Optionnel
"tache_status":"not finished", // Default en not finished but it can be finished or failed
}
```

### /tag

`Lien : http://env.DB_HOST/upload/tag`
Need session to get the user id
Headers : Content-Type: application/json

```json
// RECEIVE
{
"message":"The message",
}
```

```json
// SEND
{
"tag_name":"Dev",
}
```


### /activity

`Lien : http://env.DB_HOST/upload/activity`
Need session to get the user id
Headers : Content-Type: application/json

```json
// RECEIVE
{
"message":"The message",
}
```

```json
// SEND
{
"project_id":1,
"activity_name":"programme du react js",
"activity_importance":5,// By default 3 , but can be 1 ,2 ,3 ,4,5 ((The hightest value mean very importante
}
```












