# sign-recorder
---
End goal: Web platform for users to upload short videos of one handed signs in sign language. 

TODO:
- Craete a pipeline that allows someone to choose a sign language (Indian Sign Language, British Sign Language, Chinese Sign Language, ...) and then upload a 1-3 second video of a sign.
- The user will label their sign (should only contain letters).
- Each user should have a profile of videos
- These videos should stored on AWS Glacier Storage (if you can find a better solution then use it).
- There should be strict constraints on the videos. You should check out the GT sign data for reference. Link here: https://signdata.cc.gatech.edu/view/datasets/popsign_v1_0/
