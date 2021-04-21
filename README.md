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

```touch setup.sh && nano setup.sh```

Paste In the Following Code:

```
#!/bin/bash

#pulls DOMAIN_NAME
source config

echo "Disabling root login."

sed -i '/^PermitRootLogin/s/yes/no/' /etc/ssh/sshd_config

echo "Disabling Password Authentication"

sed -i 's/^#?PasswordAuthentication yes/PasswordAuthentication no/g' /etc/ssh/sshd_config

echo "Reloading SSHD Config"

systemctl reload sshd -y

#apt-get install -y bmon slurm tcptrack build-essential tcl

echo "Generating 2048 Bit DH Parabolic Long Prime for Encryption"

openssl dhparam -out /etc/ssl/certs/dhparam.pem 2048

wget -qO - https://www.mongodb.org/static/pgp/server-4.2.asc | sudo apt-key add -

echo "deb [ arch=amd64 ] https://repo.mongodb.org/apt/ubuntu bionic/mongodb-org/4.2 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-4.2.list

apt-get update

apt-get install -y mongodb-org

ufw allow OpenSSH && ufw allow http && ufw allow https

yes y | sudo ufw enable

cd /home/"$SUDO_USER"

curl -sL https://deb.nodesource.com/setup_14.x | bash -

apt-get install -y nodejs

apt-get install -y nginx

snap install --classic certbot

# Ubuntu 20.04

read -p 'Please enter an email address for CertBot: ' EMAIL_ADDRESS

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

echo "Cleaning Up"

cd /home/"$SUDO_USER"

rm -f config

git clone https://github.com/arcalumis/express-babel.git

cd express-babel

npm install

cat > .env <<- EOM
PORT=5000
EOM

echo "Starting your development server!!!!"

npm start

```

Save the file and close your editor.  Again, make the file executable and run it:

``` chmod +x setup.sh```
``` sudo ./setup.sh```

This will prompt you for your password.  This takes a minute.  A lot is going on.

In the future I'll list all the dependencies.

After this, your server will be protected by a free ssh certificate and include the following stack:

- Ubuntu20.04
- NGINX listening on port 443 and forwarding port 80 to port 443, listening internally for
- Node 14.x running on port 5000, being reverse proxied by NGINX
- Express Server
- Webpack / Sass Support / React / All Transpiled With Babel

Read the configs, learn as much as you can.  Happy hunting.
