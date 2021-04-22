# Preamble

The purpose of this repository is to allow anyone to have the access to setting up a secure* webserver running the following stack:

- Ubuntu 20.04
  - sudo user setup
  - firewall limited traffic
- NGINX with SSH Certificate Automatically Created
- NodeJS (14.x) running Express webserver
- React JS, Babel transpilation
- Sass and Webpack out-of-the-box.
- MongoDB (optional)

Quickly prototype an idea using advanced build tools.

**Scratch to set up in 11 minutes**

Notes: Before beginning, you should have a domain (or subdomain) registered and ready to point to a fresh server.
*This will be necessary for setting up the ssl certificate.*

- It is not necessary to clone this repository.
 - All of the files will be automatically copied to your server.

##### To-Do's for This Repo
 - Provide links to all component documentation
 - Prompt to Make MongoDB Installation Optional
 - Prompt To Make Redis Optional
 - Prompt To Make PostGres Optional

## Let's get Started

#### 1. Setup a fresh Ubuntu20.04 Server ####
 - I use [DigitalOcean](https://m.do.co/c/c3e5a07ebd4f) < My Referral Link
 - This has been tested on a $5/mo 1cpu/1gb server

#### 2. Register a Domain or Create an A Record for an Existing Domain ####
- Use the IP address of the server generated for you in the previous step

## Note: These scripts will disable root login

- ONLY USE THEM IF YOU'VE READ THEM AND UNDERSTAND THE ASSOCIATED RISKS!!!

#### 3. Login to the server as root and create a file in your home directory called setup.sh ####
- We'll go ahead and make the file executable while we're at it

``` touch setup.sh && chmod +x setup.sh && nano setup.sh ```

#### 4. Paste the following contents into the file, save it and exit your editor ####

```
#!/bin/bash

read -p 'Please enter a username: ' USERNAME

read -r -sp 'Please enter a password: ' PASSWORD

echo ""

read -r -sp 'Please confirm your password: ' CONFIRMPASSWORD

echo ""

if [ $PASSWORD = $CONFIRMPASSWORD ]; then
  echo 'Paste in your ssh key! '
  read -r SSHKEY
else
  echo 'Passwords Do not Match!'
  exit
fi

CRYPTPASS=$(openssl passwd -crypt "$PASSWORD")

useradd -m -p $CRYPTPASS -s /bin/bash -G sudo $USERNAME

mkdir /home/"$USERNAME"/.ssh

chown "$USERNAME":"$USERNAME" /home/"$USERNAME"/.ssh

chmod 700 /home/"$USERNAME"/.ssh 

echo $SSHKEY >> /home/"$USERNAME"/.ssh/authorized_keys

chmod 600 /home/"$USERNAME"/.ssh/authorized_keys

chown "$USERNAME":"$USERNAME" /home/"$USERNAME"/.ssh/authorized_keys

echo "Your user $USERNAME is set up."

echo ""

echo "Generating Config for Step 2"

read -p 'Please enter the domain name of this server: ' DOMAIN_NAME

read -p 'Please enter an email address for cerbot certificate: ' EMAIL_ADDRESS

touch /home/"$USERNAME"/config

echo "DOMAIN_NAME=\"$DOMAIN_NAME\"" >> /home/"$USERNAME"/config
echo "EMAIL_ADDRESS=\"$EMAIL_ADDRESS\"" >> /home/"$USERNAME"/config

echo "Init complete, please exit and log back in using the credentials you've entered."

```
- Save the file and close the editor

#### 5. Run it! ####
- You will be asked for a username, a password and a public key for ssh authentication
- You will be then prompted for a domain name and email address for your free certbot certificate registration.
  - Check out [this great website](https://www.google.com/search?client=firefox-b-1-d&q=generating+ssh+keys) to find out how to generate ssh keys and other cool stuff
- Tip: Have your public SSH key ready to copy and paste into the console when prompted.

```./setup.sh```

- DigitalOcean uses it's own packages so when you update and upgrade you may encounter the following:
  - If you are prompted to overwrite configuration file /etc/ssh/sshd_config: install the package maintainers version.
    - If you're curious about the differences, view the diff, they're just comments in this case.
  - When asked about /etc/systemd/resolved.conf, type Y or I and press enter
    - I believe this changes the DNS lookup address from DO's default

#### 6. Part One is Finished! Exit the terminal and log in as the user you've created. ####
- Now you have a user with ssh access setup, and a config file waiting for you in your new user's home directory when you log in.
- The config file merely contains the domain name and email you entered towards the end of the previous step.
- You can use this initial setup script to quickly create a new sudo user anytime if that's all you're after.

#### 7. Now we'll create the setup file for Part Two. This script will: ####

- Enable ufw and limit connections to http, https and ssh ports
  - Defaults to 80, 443 and 22 respectively
- Generate a unique secure key ( Diffie-Hellman 2048-bit key ) for your setup.
  - This is being modified and will be changed in a future release.
- Install bmon slurm tcptrack (server monitoring tools)
- Install build-essential and tcl
- Install NGINX and register your domain with Certbot using the email address you provide
  - Redirecting all http traffic to https
  - Listening for localhost:5000
- Install NodeJS @ 14.x
  - Running the webserver on port 5000
    - This is configurable in the .env file created in your express-babel directory
      - Note: modifying this will requre also modifying /etc/nginx/sites-enabled/default
- Install MongoDB @ 4.4 (optional)
- Install PM2 for persisting your webserver process if and when you're ready
  - Install PM2 Logrotate to prevent an out-of-memory error
- Install BabelCli and Nodemon packages globally (cross-env is also installed but not currently used)

```touch setup.sh && chmod +x setup.sh && nano setup.sh```

#### 8. Paste In the Following Code: ####
- Read through the script before you install it.

```
#!/bin/bash

#pulls DOMAIN_NAME and EMAIL_ADDRESS
source config

echo "Your domain $DOMAIN_NAME will be automatically validated."
echo "Please make sure it is pointing to the correct IP address before you continue."

read -n 1 -s -r -p "Press any key to continue"

apt-get update -y

apt-get upgrade -y

echo "Disabling root login."

sed -i '/^PermitRootLogin/s/yes/no/' /etc/ssh/sshd_config

echo "Disabling Password Authentication"

sed -i 's/^#?PasswordAuthentication yes/PasswordAuthentication no/g' /etc/ssh/sshd_config

echo "Reloading SSHD Config"

systemctl reload sshd -y

apt-get install -y bmon slurm tcptrack build-essential tcl

echo "Generating 2048 Bit DH Parabolic Long Prime for Encryption"

openssl dhparam -out /etc/ssl/certs/dhparam.pem 2048

ufw allow OpenSSH && ufw allow http && ufw allow https

yes y | sudo ufw enable

cd /home/"$SUDO_USER"

curl -sL https://deb.nodesource.com/setup_14.x | bash -

apt-get install -y nodejs

apt-get install -y nginx

snap install --classic certbot

# Ubuntu 20.04

certbot --nginx --non-interactive --agree-tos -d $DOMAIN_NAME -m $EMAIL_ADDRESS

cat > /etc/nginx/snippets/ssl-params.conf <<- EOM
# See https://cipherli.st/ for details on this configuration
ssl_protocols TLSv1 TLSv1.1 TLSv1.2;
ssl_prefer_server_ciphers on;
ssl_ciphers "EECDH+AESGCM:EDH+AESGCM:AES256+EECDH:AES256+EDH";
ssl_ecdh_curve secp384r1; # Requires nginx >= 1.1.0
ssl_session_cache shared:SSL:10m;
ssl_session_tickets off; # Requires nginx >= 1.5.9
ssl_stapling on; # Requires nginx >= 1.3.7
ssl_stapling_verify on; # Requires nginx => 1.3.7
resolver 8.8.8.8 8.8.4.4 valid=300s;
resolver_timeout 5s;
add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload";
add_header X-Frame-Options DENY;
add_header X-Content-Type-Options nosniff;
# Add our strong Diffie-Hellman group
ssl_dhparam /etc/ssl/certs/dhparam.pem;
EOM

cat > /etc/nginx/sites-enabled/default <<- EOM
# HTTP — redirect all traffic to HTTPS
server {
    listen 80;
    listen [::]:80 default_server ipv6only=on;
    return 301 https://\$host\$request_uri;
}

# HTTPS — proxy all requests to the Node app
server {
    # Enable HTTP/2
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name app.example.com;

    # Use the Let’s Encrypt certificates
    ssl_certificate /etc/letsencrypt/live/app.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/app.example.com/privkey.pem;

    # Include the SSL configuration from cipherli.st
    include snippets/ssl-params.conf;

    location / {
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-NginX-Proxy true;
        proxy_pass http://localhost:5000/;
        proxy_ssl_session_reuse off;
        proxy_set_header Host \$http_host;
        proxy_cache_bypass \$http_upgrade;
        proxy_redirect off;
    }
}
EOM

sed -i "s/app.example.com/$DOMAIN_NAME/g" /etc/nginx/sites-enabled/default

nginx -t

systemctl restart nginx

cd /home/"$SUDO_USER"

chown -R "$SUDO_USER":"$SUDO_USER" /home/"$SUDO_USER"

cd /usr/bin

npm install -g pm2 @babel/core @babel/cli cross-env nodemon

pm2 install pm2-logrotate

cd /home/"$SUDO_USER"

git clone https://github.com/arcalumis/warp-in-the-box.git

cd warp-in-the-box

npm install

cat > .env <<- EOM
PORT=5000
EOM

chown -R "$SUDO_USER":"$SUDO_USER" /home/"$SUDO_USER"/warp-in-the-box

echo "Cleaning Up"

rm -f ../config

rm -f ../setup.sh

read -p "Would you like to install MongoDB? " -n 1 -r

if [[ $REPLY =~ ^[Yy]$ ]]
then
    wget -qO - https://www.mongodb.org/static/pgp/server-4.4.asc | sudo apt-key add -

    echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/4.4 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-4.4.list

    apt-get update

    apt-get install -y mongodb-org
fi

echo "Starting your development server!!!!"

npm start

```

#### 9. Save the file and close your editor.  Again, make the file executable and run it: ####

``` sudo ./setup.sh```

 - You will be prompted for your password. Note: This takes aboute  minute.

## Congrats ✨🎉

You're all finished.  
 - Your dev server is setup, running and listening for changes to the directory files.
 - Your Sass will be compiled to the dist folder in Main.css.
 - You got a badass Nyan Cat Favion

Restart your developments server with the following command.

```npm run start```

Using PM2, You can persist your web server by running the following commands.

To webpack for production:

```npm run build``` 

To create your initial webserver [docs](https://pm2.keymetrics.io/docs/usage/quick-start/)

```sudo pm2 start npm --name "webserver" -- pm2server```

To persist your pm2 server configuration: [docs](https://pm2.keymetrics.io/docs/usage/startup/)

```pm2 startup```

**DO NOT PASS SUDO TO THIS COMMAND, IT WILL PRINT THE EXACT COMMAND YOU WILL HAVE TO COPY PASTE INTO THE TERMINAL**

To disable pm2 for development purposes.

```sudo pm2 stop webserver```

Read the configs, read the docs, learn as much as you can. Happy hacking.
