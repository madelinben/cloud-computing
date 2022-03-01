# Configuration

sudo apt update
sudo apt install nodejs npm git

sudo vi /etc/netplan/00-installer-config.yaml

enp0s8:
  dhcp4: false
  addresses: [/24]

netplan apply

sudo vi /etc/hostname
sudo hostname [NAME]

git clone https://github.com/madelinben/cloud-computing

# Deployment

npm install express zeromq@5

sudo npm install forever -g
sudo forever -w index.js & while true; do git pull; sleep 10; done

Node1 => http://192.168.56.2:3000
Node2 => http://192.168.56.3:3000
Node3 => http://192.168.56.4:3000