// Generated by CoffeeScript 1.9.0
var xmpp;
(function() {
  var Xmpp;

  Xmpp = (function() {
    function Xmpp() {
      var _xmpp;
      _xmpp = this;
      this.conn = null;
      this.jid = '';
      this.fullName = '';
      this.roster = {};
      this.messages = {};
      this.customHandlers = {};
      this.config = {
        defaultPhoto: 'views/default-propic.png',
        boshService: "http://bosh.metajack.im:5280/xmpp-httpbind"
      };
      this.photo = this.config.defaultPhoto;
      this.defaultHandlers = {
        roster: function(iq, _xmpp) {

          /*
          Default Roster Handler.
          This  is not registered using addHandler but used dynamically for sendIQ
           */
          $(iq).find('item').each(function() {
            var contact;
            contact = {};
            contact.jid = $(this).attr('jid');
            contact.name = $(this).attr('name') || contact.jid;
            contact.jid = Strophe.getBareJidFromJid(contact.jid);
            _xmpp.addContact(contact);
            return true;
          });
          return true;
        },
        vcard: function(iq, _xmpp) {
          var fn, jid, photo;
          jid = $(iq).attr('from');
          jid = Strophe.getBareJidFromJid(jid);
          if ($(iq).find('vCard').find('PHOTO')) {
            photo = $(iq).find('vCard').find('PHOTO').find('BINVAL').text();
            _xmpp.updateContact({
              photo: 'data:image/png;base64,' + photo,
              photoStatus: true
            }, jid);
          }
          if (jid === _xmpp.jid) {
            if ($(iq).find('vCard').find('PHOTO')) {
              photo = $(iq).find('vCard').find('PHOTO').find('BINVAL').text();
              _xmpp.photo = 'data:image/png;base64,' + photo;
            }
            if ($(iq).find('vCard').find('FN')) {
              fn = $(iq).find('vCard').find('FN').text();
              _xmpp.fullName = fn;
            }
          }
          return true;
        },
        presence: function(presence, _xmpp) {
          var from, jid, photo, photoOld, show, status, type;
          type = $(presence).attr('type');
          from = $(presence).attr('from');
          if (type !== 'error') {
            status = 'offline';
            jid = Strophe.getBareJidFromJid(from);
            if (type !== 'unavailable') {
              status = 'online';
              if ($(presence).find('show')) {
                show = $(presence).find('show').text();
                if (show === '' || show === 'chat') {
                  status = 'online';
                } else if (show === 'away') {
                  status = 'away';
                } else if (show === 'dnd') {
                  status = 'dnd';
                } else {
                  status = show;
                }
              }
            }
            if (jid !== _xmpp.jid) {
              _xmpp.updateContact({
                status: status
              }, jid);
            }
            if ($(presence).find('x').find('photo')) {
              photo = $(presence).find('x').find('photo');
              if (photo.length > 0) {
                photo = photo.text();
                if (photo.length > 0) {
                  photoOld = '';
                  if (_xmpp.roster[jid].photoHash) {
                    photoOld = _xmpp.roster[jid].photoHash;
                  }
                  if (photo !== photoOld) {
                    _xmpp.fetchVcard(jid);
                    _xmpp.roster[jid].photoHash = photo;
                  }
                }
              }
            }
          }
          return true;
        },
        message: function(message, _xmpp) {
          var body, jid, sentStatus;
          jid = $(message).attr('from');
          jid = Strophe.getBareJidFromJid(jid);
          sentStatus = false;
          if (jid === _xmpp.jid) {
            sentStatus = true;
            jid = $(message).attr('to');
            jid = Strophe.getBareJidFromJid(jid);
          }
          body = $(message).find('html > body');
          if (body.length === 0) {
            body = $(message).find('body');
            if (body.length > 0) {
              body = body.text();
            } else {
              body = null;
            }
          } else {
            body = body.contents();
          }
          if (!_xmpp.messages[jid]) {
            _xmpp.messages[jid] = [];
          }
          if (body) {
            _xmpp.messages[jid].push({
              from: jid,
              msg: body,
              sent: sentStatus,
              status: 'unread'
            });
            if (!_xmpp.roster[jid]) {
              _xmpp.addContact({
                jid: jid
              });
            }
            _xmpp.roster[jid].unreadStatus = true;
            _xmpp.roster[jid].unreadCount++;
          }
          return true;
        }
      };
    }

    Xmpp.prototype.connect = function(jid, password, changeHandler) {
      this.conn = new Strophe.Connection(this.config.boshService);
      this.conn.connect(jid, password, changeHandler);
      this.jid = jid;
      return this;
    };

    Xmpp.prototype.disconnect = function() {
      this.conn.disconnect();
      this.conn = null;
      this.jid = '';
      this.fullName = '';
      this.roster = {};
      this.messages = {};
      this.customHandlers = {};
      return this;
    };

    Xmpp.prototype.send = function(stanza) {
      this.conn.send(stanza);
      return this;
    };

    Xmpp.prototype.textToXml = function(text) {
      var doc, elem, output, parser;
      if (window['DOMParser']) {
        parser = new DOMParser();
        doc = parser.parseFromString(text, 'text/xml');
      } else if (window['ActiveXObject']) {
        doc.async = false;
        doc.loadXML(text);
      } else {
        output = null;
      }
      elem = doc.documentElement;
      if ($(elem).filter('parsererror').length > 0) {
        output = null;
      } else {
        output = elem;
      }
      return output;
    };

    Xmpp.prototype.sendFromText = function(text) {
      text = this.textToXml(text);
      if (text) {
        this.send(text);
      }
      return this;
    };

    Xmpp.prototype.sendIQ = function(iq, handler) {
      this.conn.sendIQ(iq, handler);
      return this;
    };

    Xmpp.prototype.sendMessage = function(jid, body) {
      this.send($msg({
        to: jid,
        type: 'chat'
      }).c('body').t(body));
      if (!this.messages[jid]) {
        this.messages[jid] = [];
      }
      this.messages[jid].push({
        from: this.jid,
        msg: body,
        sent: true,
        status: 'read'
      });
      return this;
    };

    Xmpp.prototype.presence = function(toUid) {
      var pres;
      if (toUid) {
        pres = $pres({
          to: toUid
        });
      } else {
        pres = $pres();
      }
      this.send(pres);
      return this;
    };

    Xmpp.prototype.addContact = function(contactData, overwrite) {
      var contact, jid;
      if (contactData.jid) {
        jid = contactData.jid;
      }
      if (this.roster[jid]) {
        if (!overwrite) {
          this.updateContact(contactData);
          return true;
        }
      }
      if (this.jid === jid) {
        return true;
      }
      contact = {
        jid: jid,
        name: jid,
        nickName: jid,
        photoStatus: false,
        photo: this.config.defaultPhoto,
        photoHash: '',
        status: 'offline',
        unreadCount: 0,
        unreadStatus: false
      };
      if (contactData.name) {
        contact.name = contactData.name;
      }
      if (contactData.nickName) {
        contact.nickName = contactData.nickName;
      }
      if (contactData.nickName) {
        contact.nickName = contactData.nickName;
      }
      if (contactData.photoStatus) {
        contact.photoStatus = contactData.photoStatus;
      }
      if (contactData.photo) {
        contact.photo = contactData.photo;
      }
      if (contactData.photoHash) {
        contact.photoHash = contactData.photoHash;
      }
      this.roster[jid] = contact;
      return this;
    };

    Xmpp.prototype.updateContact = function(contactData, contactJid) {
      var contact, jid;
      if (contactData.jid) {
        jid = contactData.jid;
      } else if (contactJid) {
        contactData.jid = contactJid;
        jid = contactJid;
      }
      if (!this.roster[jid]) {
        this.addContact(contactData);
        return true;
      }
      contact = this.roster[jid];
      if (contactData.name) {
        contact.name = contactData.name;
      }
      if (contactData.status) {
        contact.status = contactData.status;
      }
      if (contactData.nickName) {
        contact.nickName = contactData.nickName;
      }
      if (contactData.nickName) {
        contact.nickName = contactData.nickName;
      }
      if (contactData.photoStatus) {
        contact.photoStatus = contactData.photoStatus;
      }
      if (contactData.photo) {
        contact.photo = contactData.photo;
      }
      if (contactData.photoHash) {
        contact.photoHash = contactData.photoHash;
      }
      this.roster[jid] = contact;
      return this;
    };

    Xmpp.prototype.setupHandlers = function() {
      var messageHandler, presenceHandler, _xmpp;
      _xmpp = this;
      presenceHandler = function(presence) {
        if (_xmpp.customHandlers.presence) {
          if (!_xmpp.customHandlers.presence.override) {
            _xmpp.defaultHandlers.presence(presence, _xmpp);
          }
          _xmpp.customHandlers.presence.handler(presence);
        } else {
          _xmpp.defaultHandlers.presence(presence, _xmpp);
        }
        return true;
      };
      this.conn.addHandler(presenceHandler, null, 'presence');
      messageHandler = function(message) {
        if (_xmpp.customHandlers.message) {
          if (!_xmpp.customHandlers.message.override) {
            _xmpp.defaultHandlers.message(message, _xmpp);
          }
          _xmpp.customHandlers.message.handler(message);
        } else {
          _xmpp.defaultHandlers.message(message, _xmpp);
        }
        return true;
      };
      this.conn.addHandler(messageHandler, null, 'message', 'chat');
      return this;
    };

    Xmpp.prototype.fetchRoster = function() {
      var handler, iq, _xmpp;
      _xmpp = this;
      handler = function(iq) {
        if (_xmpp.customHandlers.roster) {
          if (!_xmpp.customHandlers.roster.override) {
            _xmpp.defaultHandlers.roster(iq, _xmpp);
          }
          _xmpp.customHandlers.roster.handler(iq);
        } else {
          _xmpp.defaultHandlers.roster(iq, _xmpp);
        }
        return true;
      };
      iq = $iq({
        type: 'get'
      }).c('query', {
        xmlns: 'jabber:iq:roster'
      });
      this.sendIQ(iq, handler);
      return this;
    };

    Xmpp.prototype.fetchVcard = function(to) {
      var handler, iq, _xmpp;
      _xmpp = this;
      handler = function(iq) {
        if (_xmpp.customHandlers.vcard) {
          if (!_xmpp.customHandlers.vcard.override) {
            _xmpp.defaultHandlers.vcard(iq, _xmpp);
          }
          _xmpp.customHandlers.vcard.handler(iq);
        } else {
          _xmpp.defaultHandlers.vcard(iq, _xmpp);
        }
        return true;
      };
      iq = $iq({
        type: 'get',
        to: to
      }).c('vCard', {
        xmlns: 'vcard-temp'
      });
      this.sendIQ(iq, handler);
      return this;
    };

    Xmpp.prototype.fetchSelfVcard = function() {
      this.fetchVcard(this.jid);
      return this;
    };

    Xmpp.prototype.fetchPics = function() {
      var roster, _i, _len, _ref;
      _ref = this.roster;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        roster = _ref[_i];
        if (roster.status !== 'offline' && roster.photoStatus === false) {
          this.fetchVcard(roster.jid);
        }
      }
      return this;
    };

    Xmpp.prototype.registerHandler = function(type, handler, override) {
      if (!override) {
        override = false;
      }
      this.customHandlers[type] = {
        handler: handler,
        override: override
      };
      return this;
    };

    Xmpp.prototype.getDefaultRoster = function() {
      return this.roster;
    };

    return Xmpp;

  })();

  xmpp = new Xmpp;

}).call(this);
