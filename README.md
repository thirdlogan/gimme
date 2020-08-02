# gimme gimme gimme
A WebExtension for downloading media from webpages, especially tuned downloading image galleries with thumbnails that point to detail pages with large versions of the image on them. It also supports downloading the media shown on a page, and digging galleries of galleries. You'll find code for experimental features for downloading audio and for downloading video (the buttons are just hidden), but the gallery digging is always priority #1.

Two terms are used for the automatic media-finding: Dig and Scrape. Dig is for galleries, and galleries of galleries -- sites where one must dig into the detail pages to find the original media. Scrape is for getting media that is directly on the page. 

As mentioned before, code is there to download video and audio files as well, but is not currently exposed and has not been tested much. Feel free to un-hide the extra buttons in popup/style.css to download the other media types. The event handlers and back-end are all set up, just the buttons are hidden.

This extension works with Chrome, Firefox, and Edge -- it can be found in all three extension stores in addition to in this repo.

# v0.4.11
This release focuses on getting _Stop_ to work better, and much more quickly. I must have some `Promise`-based problems, and the `Promise.reject()`s must not be being caught where I thought they were, perhaps being handled multiple times or maybe getting eaten by an over-eager `catch()` or `finally()` thrown on in the middle...

# building
Execute "npm run pack" in the base directory to build the bundle.js and bundle.js.map files. That's all! Then either zip it up and add it, or just load it as an unpacked extension from the repo root directory. Please note that the html components all reference the bundle.js files only

