# How to Make This Work

First of all, you should know that it took me a lot of time as well. Here are the steps:
1. You need to download neo4j command line tools somehow. I downloaded it using brew. (Note: Other ways of working with the neo4j movie library can work, but you need to change the code)
2. Once you have the command line tool, start a session with `neo4j console`. This will start the database on your localhost. 
3. With your browser, go to http://localhost:7474.
4. You will have to login. The default username and password is neo4j (both of them).
5. The website will prompt you to change your password. Do so. You will also have to change line 101 in `scripts/index.js` to your renewed password.
6. We will use the movie database. On the website, you will type `:play movie-graph` in the prompt on top of your screen.
7. Follow the instructions there to set up the movie graph.
8. You are ready to go! Launch the `index.html` file. Enjoy!
