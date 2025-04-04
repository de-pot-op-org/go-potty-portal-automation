# How To: Manually Add Users to Potty Portal

Owner: Brian Manuputty

This guide involves 4 steps:

1. Creating a user
2. Updating the database
3. Securing a password link
4. Sending a password email.

# 1. Creating A User

1. Before you start make sure you have the following info ready:
    - **Email address**
    - **Password** - Create a safe one here: [https://1password.com/password-generator/](https://1password.com/password-generator/) and temporarily store it somewhere. Be sure to delete it after you create the user.
        
        ![Untitled](How%20To%20Manually%20Add%20Users%20to%20Potty%20Portal%20ff19feb3f0054e15b5790ee01937a8f8/Untitled.png)
        
2. Go to [https://console.firebase.google.com/u/1/project/go-potty-portal/overview](https://console.firebase.google.com/u/1/project/go-potty-portal/overview).
3. In the left menu click on ‘Build’ (1) and then on ‘Authentication’. (2)
    
    ![Untitled](How%20To%20Manually%20Add%20Users%20to%20Potty%20Portal%20ff19feb3f0054e15b5790ee01937a8f8/Untitled%201.png)
    
4. Click on ‘Add User’.
    
    ![Untitled](How%20To%20Manually%20Add%20Users%20to%20Potty%20Portal%20ff19feb3f0054e15b5790ee01937a8f8/Untitled%202.png)
    
5. Enter the email address (1) and password (2) of the user. Click 'Add user' (3) and the user will be created.
    
    ![Untitled](How%20To%20Manually%20Add%20Users%20to%20Potty%20Portal%20ff19feb3f0054e15b5790ee01937a8f8/Untitled%203.png)
    

# 2. Updating the database

<aside>
⚠️ Make sure the organisation of the user is present in the database. Every user should have an organisation by design. For instructions on how to create an organisation [click here](https://www.notion.so/How-To-Manually-Create-Organisations-c6eadc89e53c4b65907da4b911723364?pvs=21).

</aside>

Each user should have the following data in the database set up before logging into the app for the first time:

- [ ]  Organisation document
- [ ]  User document
    - [ ]  User Profiles document
- [ ]  Organisation member document
- [ ]  Organisation member custom claim

### 2.1 User Document

1. Make sure you have the user id ready, then make a new document in the `users` collection and give it the ID of the user you just created.
    
    ![Untitled](How%20To%20Manually%20Add%20Users%20to%20Potty%20Portal%20ff19feb3f0054e15b5790ee01937a8f8/Untitled%204.png)
    
2. Fetch the document and click *Edit Document as JSON*
    
    ![Untitled](How%20To%20Manually%20Add%20Users%20to%20Potty%20Portal%20ff19feb3f0054e15b5790ee01937a8f8/Untitled%205.png)
    
3. Fill in the following JSON with the appropriate email and timestamps and click `Save`.
    
    ```json
    {
      "created_at": {
        "__time__": "2024-05-03T09:12:42.033Z"
      },
      "email": "email@email.com",
      "updated_at": {
        "__time__": "2024-05-03T09:12:42.033Z"
      }
    }
    ```
    

### 2.2 User Profiles Document

Inside the `users` document find the `user_profiles` sub collection and create a similar document with the same ID and the following JSON. Update the display name, timestamps and press save:

```json
{
  "created_at": {
    "__time__": "2024-06-20T20:10:33.844Z"
  },
  "display_name": "Femke",
  "organisation_id": "nVZGd1IqL7gQgzpOYTWN",
  "updated_at": {
    "__time__": "2024-06-20T20:10:33.844Z"
  }
}
```

### 2.3 Organisation Member Document

Find the organisation document of the user in the `organisations` collection. Underneath this document find or create the sub collection `organisation_members` and paste in the following JSON. Update the timestamps, fill in your ID in the `created_by` and `updated_by` fields and fill in the `user_id` of the user as fields as well as the *document id*. Lastly remove any non relevant roles from `roles`.

```json
{
  "created_at": {
    "__time__": "2024-12-02T10:33:25.523999Z"
  },
  "created_by": "QkfQFGJNQTZIcN3irS9JXfYWeAM2",
  "roles": [
    "owner",
    "editor",
    "viewer"
  ],
  "updated_at": {
    "__time__": "2024-12-02T10:33:33.032999Z"
  },
  "updated_by": "QkfQFGJNQTZIcN3irS9JXfYWeAM2",
  "user_id": "QkfQFGJNQTZIcN3irS9JXfYWeAM2"
}
```

### 3.3 Organisation Custom Claim

In order for our security rules to work our users must have their `organisation_id` saved in their token as a custom claim. Before proceeding make sure you have the organisation ID in your clipboard.

1. Start by locating the user in the *Authentication* tab in Firefoo, right click the entry and choose ‘*Edit User Details’*.
    
    ![Untitled](How%20To%20Manually%20Add%20Users%20to%20Potty%20Portal%20ff19feb3f0054e15b5790ee01937a8f8/Untitled%206.png)
    
2. Locate the label *Claims* and update/create the JSON with the `organisation_id`.
    
    ![Untitled](How%20To%20Manually%20Add%20Users%20to%20Potty%20Portal%20ff19feb3f0054e15b5790ee01937a8f8/Untitled%207.png)
    

# 3. Securing A Password Link

1. Open BitWarden and click on ‘Send’.
    
    ![Untitled](How%20To%20Manually%20Add%20Users%20to%20Potty%20Portal%20ff19feb3f0054e15b5790ee01937a8f8/Untitled%208.png)
    
2. Click on the plus button (1), enter ‘Go Potty Password’ (2) as a ‘Name’, activate the ‘Text’ radio button (3) and paste in your generated password (4). This is a good moment to remove the password from your computer. 
    
    ![Untitled](How%20To%20Manually%20Add%20Users%20to%20Potty%20Portal%20ff19feb3f0054e15b5790ee01937a8f8/Untitled%209.png)
    
3. Scroll down a little bit and expand the ‘Options’ tab (1). Double check the following:
    1. Deletion date is set to 7 days (2)
    2. Expiration date is set to ‘Never’ (3)
    3. Maximum access count is blank (4)
    4. Password is blank (5)
    
    ![Untitled](How%20To%20Manually%20Add%20Users%20to%20Potty%20Portal%20ff19feb3f0054e15b5790ee01937a8f8/Untitled%2010.png)
    
4. When all is correct press the save icon.
    
    ![Untitled](How%20To%20Manually%20Add%20Users%20to%20Potty%20Portal%20ff19feb3f0054e15b5790ee01937a8f8/Untitled%2011.png)
    
5. Scroll down and copy the link, we will send this link in an email to the user.
    
    ![Untitled](How%20To%20Manually%20Add%20Users%20to%20Potty%20Portal%20ff19feb3f0054e15b5790ee01937a8f8/Untitled%2012.png)
    

# 4. Sending A Password Email

Copy the following template and fill in the blanks:

1. Subject:
    1. English
        
        ```
        🚽 Go Potty Portal Login Details
        ```
        
    2. Dutch
        
        ```
        🚽 Go Potty Portal Inloggegevens
        ```
        
2. Body:
    1. English
        
        ```
        Hello,
        
        You have been granted access to the Go Potty portal. Please use the information below to log in.
        
        Website: https://go-potty-portal.web.app/
        Email: EMAIL
        Password link: URL
        
        The password link is valid for 7 days. If you have any questions or need assistance, do not hesitate to contact us at hello@gopottynow.com or by replying to this email. We're here to help!
        
        Kind regards,
        NAME
        ```
        
    2. Dutch
        
        ```
        Hallo,
        
        Je hebt toegang gekregen tot het De Pot Op portaal. Gebruik de onderstaande informatie om in te loggen.
        
        Website: https://go-potty-portal.web.app/
        E-mail: EMAIL
        Wachtwoord link: URL
        
        De link is 7 dagen geldig. Als je vragen hebt of hulp nodig hebt, neem dan contact met ons op via hallo@depotop.nu of door deze e-mail te beantwoorden.
        
        Vriendelijke groeten,
        NAAM
        ```