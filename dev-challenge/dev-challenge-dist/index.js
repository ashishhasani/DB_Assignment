//variables declaration
var table = "";
var table = "<table><thead><tr> <th>Name1</th> <th>Best Bid</th> <th>Best Ask</th> <th>change Bid</th> <th>Change Ask</th> </tr> </thead>"
var myArray = [];
// This is not really required, but means that changes to index.html will cause a reload.
require('./site/index.html')
// Apply the styles in style.css to the page.
require('./site/style.css')

//function to create table definition
function createHeader() {
    var table = "<table id='myTable'><thead><tr> <th>Currency Pair</th> <th>Best Bid</th> <th>Best Ask</th> <th>Last Change Bid</th> <th>Last Change Ask</th><th>Sparkline</th> </tr><thead><tbody></tbody></table>";
    document.getElementById("table").innerHTML = table;
};

createHeader();

global.DEBUG = false
var currencyPairs = [];
var sparkLineData = {};
const url = "ws://localhost:8011/stomp"
const client = Stomp.client(url)
//To recieve messages from server
var subscription = function () {
    client.subscribe("/fx/prices", function (message) {
        var priceData = JSON.parse(message.body);
        //Updating Tables
        if (currencyPairs.indexOf(priceData.name) > -1) {
            addSparkLineData(priceData.name,(priceData.bestBid+priceData.bestAsk)/2);
            var tr = '<td>' + priceData.name + '</td>' +
                '<td >' + priceData.bestBid + '</td>' +
                '<td>' + priceData.bestAsk + '</td>' +
                '<td>' + priceData.lastChangeBid + '</td>' +
                '<td>' + priceData.lastChangeAsk + '</td>'+
                '<td id="' + priceData.name + '_sparkline"></td>' ;
            document.getElementById(priceData.name).innerHTML = tr;
    //Adding rows for each currency exchange pair
        } else {
            currencyPairs.push(priceData.name);
            sparkLineData[priceData.name] = [];
            addSparkLineData(priceData.name,(priceData.bestBid+priceData.bestAsk)/2);
            var tr = '<tr id="' + priceData.name + '">' +
                '<td>' + priceData.name + '</td>' +
                '<td>' + priceData.bestBid + '</td>' +
                '<td>' + priceData.bestAsk + '</td>' +
                '<td>' + priceData.lastChangeBid + '</td>' +
                '<td>' + priceData.lastChangeAsk + '</td>' +
                '<td id="' + priceData.name + '_sparkline"></td>' +
                '</tr>';
            var tableRef = document.getElementById('myTable').getElementsByTagName('tbody')[0];
            var rowCount = tableRef.rows.length;
            var row = tableRef.insertRow(rowCount).outerHTML = tr;

        }
        drawSparkline(priceData.name)
        sortTable();
    });
};
//Creatig arrays for each currency pair to use for sparkline
function addSparkLineData(name,data){
    if(sparkLineData[name].length==30){
        sparkLineData[name].push(data);
        sparkLineData[name].shift();
    }else{
        sparkLineData[name].push(data);
    }
}
//function to sort table on lastChangeBid
function sortTable() {
    var table, rows, switching, i, x, y, shouldSwitch;
    table = document.getElementById("myTable");
    switching = true;

    while (switching) {
        switching = false;
        rows = table.getElementsByTagName("TR");
        for (i = 1; i < (rows.length - 1); i++) {
            shouldSwitch = false;
            x = rows[i].getElementsByTagName("TD")[3];
            y = rows[i + 1].getElementsByTagName("TD")[3];
            if (x.innerHTML.toLowerCase() > y.innerHTML.toLowerCase()) {
                shouldSwitch= true;
                break;
            }
        }
        if (shouldSwitch) {
            rows[i].parentNode.insertBefore(rows[i + 1], rows[i]);
            switching = true;
        }
    }
}

setTimeout(function () {
    subscription()
}, 1000);

client.debug = function (msg) {
    if (global.DEBUG) {
        console.info(msg)
    }
}
//Function to draw sparklines
function drawSparkline(name) {
    const sparkElement = document.getElementById(name+'_sparkline');
    const sparkline = new Sparkline(sparkElement)
    sparkline.draw(sparkLineData[name]);
}

function connectCallback() {
    document.getElementById('stomp-status').innerHTML = "It has now successfully connected to a stomp server serving price updates for some foreign exchange currency pairs."
}

client.connect({}, connectCallback, function (error) {
    alert(error.headers.message)
})
