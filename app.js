const http = require('http'); //For creating a Server
const https = require('https'); //For making https get request to time.com

const timeUrl = 'https://time.com/';

/**
 * Parsing Latest Stories
 *
 * @param {String} text time.com homepage html in text format
 * @returns {String} json stringify stories. 
 */
function getLatestStories(text){

    const stories = [];

    //Slice-out Latest Stories section
    const start = text.search('data-module_name="Latest Stories"');
    const end = text.search('data-module_name="Magazine Subscription"');
    text = text.slice(start, end);

    //Error handling if not slice-out
    if(start == -1 || end == -1){
        return [{"error":"Notable to read "+ timeUrl +" webpage."}];
    }

    let count = 0;

    try{
        while((text.search('<li class="latest-stories__item">') != -1) && (count < 6))
        {
            //Slice-out single-single story for each iteration.
            const li_start = text.search('<li class="latest-stories__item">');
            const li_end = text.search('</li>');
            let li = text.slice(li_start, li_end);

            //Extracting story title.
            let title = li.slice(li.search('<h3 class="latest-stories__item-headline">'), li.search('</h3>'));
            title = title.replace(/<[^>]+>/g, ''); //Removing all html tags in title eg:<b><i>...etc

            //Extracting story link.
            let link = li.slice(li.search('<a href="/'), li.search('/">'));
            link = link.replace('<a href="/','');
            link = timeUrl + link + '/';

            //Pushing a story into main array.
            stories.push({"title": title, "link": link});

            //Removing extracted story from main text.
            text = text.slice(li_end + 5, text.length - 1);

            count++;
        }
    } 
    catch(err){
        return [{"error":"Notable to parse " + timeUrl + " webpage."}];
    }
    return JSON.stringify(stories);
}

//Creating Server
const app = http.createServer((req, res)=>{

    //Checking user request
    if(req.method == 'GET' && req.url == '/getTimeStories'){
        
        let text = '';
        //Making request to time.com server.
        https.get(timeUrl, (timeRes) => {

            //Fetching homepage html page and storing into text.
            timeRes.on('data', (chunk) => {
                text = text + chunk;
            });

            //Giving response to user.
            timeRes.on('end', () => {
                res.setHeader('Content-Type', 'application/json');
                res.end(getLatestStories(text));
            });
            
        }).on('error', (e) =>{
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify([{"error": "Notable to connect "+ timeUrl +" server"}]));
        });

    }

});
app.listen('3000');
