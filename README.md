Merlin
======

## Merlin chat

**Merlin Chat** is an under development fully featured multi user _XMPP client_ written with **Angular JS**  and using **Strophejs**

#### Download

* [Download the Zip](https://github.com/MerlinChat/Merlin/archive/master.zip)
* Or clone the repo  `git clone https://github.com/MerlinChat/Merlin.git`

#### Setup

```
npm install
```

#### Run

```
node server.js
```
###### Run at a specific port
To run at port, say, 2000
```
node server.js 2000
```

To run at port 80, you may need priviliged access
```
sudo node server.js 80
```
##### Tasks Completed

1. Basic Connection and Streams (Console or debugging)
2. Fetching Roster
3. Sending and Fetching Messages

##### Tasks Left

1. Roster Manipulations (Managing Sbscriptions)
2. Birthday Alerts based on vCard data
3. HAndling additional data in message tags(eg. active state and composing)
