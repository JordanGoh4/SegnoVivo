In order for the user to start the website, they will first have to download the required packages that are listed by running: npm install. Once done, they can run the command: npm run dev, to start up the localhost server. The user can then enter the website by entering the localhost url into a web browser.
As for the database, the user will have to download MYSQL workbench and create their root user first. Once that is done, they will have to update the .env file with the necessary details before running: node server.js.

Example (.env):
DB_HOST='localhost'
DB_USER='{Your user}'
DB_PASS='{Your Password}'
DB_NAME='{Your database name}'
JWT_SECRET='{Secret}'
SESSION_SECRET={Secret}
GOOGLE_CLIENT_ID= {ID}
GOOGLE_CLIENT_SECRET= {Secret}


If users would like to test the Captions Chrome extension, they would have to select the entire extension project folder containing the extension files(which can be found in this path in our GitHub repository, Captions/sign-avatar-extension) and download them. 

Upon downloading, users can then open Chrome and visit the Extensions page, which can be done by entering chrome://extensions/ in the address bar. After that, look at the top right and turn on Developer mode, before clicking on the “Load unpacked” button at the top left, and then simply choose the downloaded file for the extension to be accessible. 

In an ideal world, this file would have been uploaded onto the Chrome store, whereby users can simply download the extension without having to download the files. However due to financial constraints in having to pay to register and create a Developer account, we were unable to make it happen as of this submission. 

Meanwhile, for the Predictor, nothing needs to be done from the user side as the backend is hosted on Render. However, as mentioned earlier, users can expect a bootup time on Render’s side by up to 1 minute due to the use of their free plan since Render stops the servers whenever there is inactivity greater than 15 seconds. 
