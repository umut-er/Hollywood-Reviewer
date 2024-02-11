var cy;

document.addEventListener('DOMContentLoaded', function() {    
    cy = cytoscape({
        container: document.getElementById("cy"),
        style: [
            {
                selector: 'node[label="actor"]',
                style: {
                    'background-color': "#FFD700",
                    'label': 'data(name)',
                }
            },
            {
                selector: 'node[label="movie"]',
                style: {
                    'background-color': "#00D700",
                    'label': 'data(title)',
                }
            },
            {
                selector: 'edge',
                style: {
                    'width': 3,
                    'line-color': '#ccc',
                    'target-arrow-color': '#ccc',
                    'target-arrow-shape': 'triangle',
                    'curve-style': 'bezier'
                }
            },
        ],
        layout: {
            name: 'fcose',
            randomize: false
        }
    })
    .on('cxttap', (event) => {
        if(event.target.data("label") == "movie"){
            contextMenu.hideMenuItem("add-movies")
            contextMenu.showMenuItem("add-actors")
        }  
        else{
            contextMenu.hideMenuItem("add-actors")
            contextMenu.showMenuItem("add-movies")
        }
    });

    var contextMenu = cy.contextMenus({
        menuItems: [
            {
                id: 'add-movies',
                content: 'add movies',
                selector: 'node',
                onClickFunction: function(event){
                    var target = event.target || event.cyTarget
                    ultimate_getter(target.data("name"), 1, 0);
                }
            },
            {
                id: 'add-actors',
                content: 'add actors',
                selector: 'node',
                onClickFunction: function(event){
                    var target = event.target || event.cyTarget
                    console.log(target)
                    ultimate_getter(target.data("title"), 1, 1);
                }
            }
        ]
    })

    var animation_ongoing = false;
    
    let login_form = document.getElementById("submit-form");
    login_form.addEventListener("click", (e) => {
        e.preventDefault();
        if(!animation_ongoing){
            login_form.classList.add("button-animation")
            animation_ongoing = true;
            setTimeout(() => {
                login_form.classList.remove("button-animation")
                animation_ongoing = false;
            }, 600)
        }
        
        let actor_name = document.getElementById("name")
        let actor_number = document.getElementById("number")
        ultimate_getter(actor_name.value, actor_number.value, 0)
    })

    let trash_button = document.getElementById("clear-button");
    trash_button.addEventListener("click", (e) => {
        cy.elements().remove()
    })
});

let driver
(async () => {
    const URI = 'neo4j://localhost:7687'
    const USER = 'neo4j'
    const PASSWORD = '########'

    try {
        driver = neo4j.driver(URI, neo4j.auth.basic(USER, PASSWORD))
        const serverInfo = await driver.getServerInfo()
        console.log('Connection established')
        console.log(serverInfo)
    } catch(err) {
        console.log(`Connection error\n${err}\nCause: ${err.cause}`)
    }
})();

function recalculate_layout(){
    var layout = cy.layout({
        name: 'fcose',
        randomize: true
    })

    layout.run()
}

// mode == 0 => starting node is a person, mode == 1 => starting node is a movie
function ultimate_getter(name, actor_number, mode){
    let match_str
    if(mode == 0){
       match_str = `MATCH (p:Person {name: "${name}"})-[a*0..${actor_number}]-(ele)
       RETURN DISTINCT ele, a`
    }
    else{
        match_str = `MATCH (m:Movie {title: "${name}"})-[a*0..${actor_number}]-(ele)
       RETURN DISTINCT ele, a`
    }


    let session = driver.session()
    session
        .executeRead((tx) => tx.run(
            match_str
        ))
        .then((res) => {
            persons = []
            movies = []
            for(const record of res.records){
                item = record.get("ele")
                if(item.labels[0] == "Person"){ // Person
                    persons.push(item)
                }
                else{ // Movie
                    movies.push(item)
                }
            }
            return [res, persons, movies];
        })
        .then(([res, persons, movies]) => {
            for(person of persons){
                if(!cy.getElementById(`${person.identity}`).empty())
                    continue
                cy.add({
                    group: "nodes",
                    data: {
                        id: `${person.identity}`,
                        label: "actor",
                        name: person.properties.name
                    }
                })
            }
            for(movie of movies){
                if(!cy.getElementById(`${movie.identity}`).empty())
                    continue
                cy.add({
                    group: "nodes",
                    data: {
                        id: `${movie.identity}`,
                        label: "movie",
                        title: movie.properties.title
                    }
                })
            }

            return res
        })
        .then((res) => {
            for(const record of res.records){
                var edges = record.get("a")
                for(const edge of edges){
                    var starting_node = `${edge.start}`
                    var ending_node = `${edge.end}`
                    if(!cy.getElementById(starting_node + " " + ending_node).empty())
                        continue;
                    cy.add({
                        group: "edges",
                        data: {
                            id: starting_node + " " + ending_node,
                            source: starting_node,
                            target: ending_node
                        }
                    })
                }
            }
        })
        .then(recalculate_layout)
        .catch((e) => {
            console.log(e)
        })
        .finally(() => {
            session.close()
        })
}

