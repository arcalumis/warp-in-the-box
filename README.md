#Basic Server Setup

- Setup a fresh Ubuntu20.04 Server, I use DigitalOcean

- Register a Domain or Create an A Record for the Existing Domain 
- Using the IP address of the server generated for you in the previous step

- Have your public SSH key ready to copy and paste in to the dialog when asked

## Note: These scripts will disable root login

- ONLY USE THEM IF YOU'VE READ THEM AND UNDERSTAND THE RISKS!!!

- Login to the server as root and create a file in your home directory called setup.sh

- Paste the following content into the file, save it and exit your editor

```
#!/bin/bash

read -p 'Please enter a username: ' USERNAME

read -r -sp 'Please enter a password: ' PASSWORD

echo ""

read -r -sp 'Please confirm your password: ' CONFIRMPASSWORD

echo ""

if [ $PASSWORD = $CONFIRMPASSWORD ]; then
  echo 'Paste in your ssh key! '
  read -s SSHKEY
else
  echo 'Passwords Do not Match!'
  exit
fi

apt-get update -y

apt-get upgrade -y

CRYPTPASS=$(openssl passwd -crypt "$PASSWORD")

useradd -m -p $CRYPTPASS -s /bin/bash -G sudo $USERNAME

mkdir /home/"$USERNAME"/.ssh

chown "$USERNAME":"$USERNAME" /home/"$USERNAME"/.ssh

chmod 700 /home/"$USERNAME"/.ssh 

echo $SSHKEY >> /home/"$USERNAME"/.ssh/authorized_keys

chmod 600 /home/"$USERNAME"/.ssh/authorized_keys

chown "$USERNAME":"$USERNAME" /home/"$USERNAME"/.ssh/authorized_keys

echo "Copying Node Mongo NGINX Setup Script"

cp node-mongo-nginx.sh /home/"$USERNAME"/node-mongo-nginx.sh

chmod 700 /home/"$USERNAME"/node-mongo-nginx.sh

chown "$USERNAME":"$USERNAME" /home/"$USERNAME"/node-mongo-nginx.sh

echo "Copy Complete"

echo "Generating Config for Step 2"

read -p 'Please enter a domain: ' DOMAIN_NAME

touch /home/"$USERNAME"/config

echo "DOMAIN_NAME=\"$DOMAIN_NAME\"" >> /home/"$USERNAME"/config

```
- Save the file and close the editor

Make the file executable:

```chmod +x setup.sh```

Run the file:

```./setup.sh```

Now you have a user with ssh access setup, and a config file waiting for you in your
new user's home directory when you log in.  Exit the terminal and log in as the user
you've created.

