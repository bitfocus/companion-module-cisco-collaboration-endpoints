* Mute (Untoggle)
* Volume Control (Set)
* Video: Start/Stop/Select Input
* Screen/Presentation: Start/Stop

## Enhancements
* Parse response XML for errors
* E20 won't take DTMFSend because it's looking for a CallID. Maybe not worth doing right now, but it's possible
  that going forward it may be worth enumerating the calls and picking one. Call ID can be found in 
  http://<ip>/getxml?location=Status/Call
* Mute Toggle support

## Longer term
* Build polling support for feedback
* Autogenerate API calls from device configuration
