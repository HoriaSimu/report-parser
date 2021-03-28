// identifying elements on page and assigning them a variable name
var form = document.getElementById('myForm');
var button = document.getElementById('parseButton');
var report = document.getElementById('report');

//initialize the output collection of data, as an empty array
var output = [];

// the lists of cost centers relevant for the final report
var firstDepartment = {
  name: 'Department #1',
  ccList: [ '1111', '1112', '1113', '1114', '1115' ]
};

var input = [ firstDepartment ];

// the unnecessary header part from the report, which needs to be removed before extracting data
var header = '-----------------------------------------------------------------------------------------------' + '\n' +
'\n' +
'PersNo           Name, first name          Date     First IN      LastOUT   Co medical' + '\n' +
'                                                                               Wkd day' + '\n' +
'                                                          Dy           Dy           Dy' + '\n' +
'---------------------------------------------------------------------------------------';

//prevents the default refresh of page when clicking button
function handleForm(event) { event.preventDefault(); }
form.addEventListener('submit', handleForm);

// when button is clicked, run function parseReport
button.addEventListener('click', parseReport);

// the function parseReport, which will be ran when button is pressed
function parseReport() {
  console.log('button was clicked');

  var rawReportData = report.value; // collect the pasted raw text from the report field
  report.value = ''; // empty the report field, leave no data behind
  var cleanedData = rawReportData.split(header).join(''); // delete all the unnecessary headers from the report
  var ccCollection = cleanedData.split('Department:        '); // split the report into a collection of strings, one string per cost center

  for (let k = 0; k < input.length; k++) {
    // initialize values for subtotal row
    var subtotal = {
      description : input[k].name,
      employees : 0,
      sickRate : 0,
      sickLeave : 0
    };

    var sickLeavesCounter = 0;

    for (let i = 0; i < ccCollection.length; i++) {   // loop through every element of the collection of cost center strings
      // if the first 4 characters of the string is a cost center in ccList, then process the data. else skip.
      if (input[k].ccList.includes(ccCollection[i].substring(0, 4))) {
        // split the rows of the string into another collection of strings.

        var costCenterData = ccCollection[i].split('\n'); // "\n" is the special character for line breaks. we split the string at each line breaks
        // the first element of costCenterData will always contain the cost center number and description
        var firstRow = costCenterData[0];
        // the last element will always contain the number of persons
        var lastRow = costCenterData[costCenterData.length-2];
        // the second to last element will always contain the totals - incl. the total sickness leaves
        var secondLastRow = costCenterData[costCenterData.length-4];

        var elementOutput = {};
        elementOutput.ccNumber = firstRow.substring(0, 4); // extracting the first 4 characters of the first element (cost center number)
        elementOutput.ccDescription = firstRow.substring(5, firstRow.length); // extracting the rest of the characters (cc description)
        elementOutput.ccTotal = Number(lastRow.split('Number of persons: ').join('')); // extracting the total number of employees

        if (secondLastRow.length === 86) {  // when there are sick leaves, this string is 86 characters long. else it's shorter.
          var temp = secondLastRow.substring(secondLastRow.indexOf(',')-5, secondLastRow.indexOf(',')).trim(); // extract sick leaves from string
          elementOutput.ccSickLeave = Number(temp);
        } else {
          elementOutput.ccSickLeave = 0;
        }

        elementOutput.ccSickRate = sickRatePercentage(elementOutput.ccSickLeave, elementOutput.ccTotal);

        sickLeavesCounter = sickLeavesCounter + elementOutput.ccSickLeave;

        subtotal.employees = subtotal.employees + elementOutput.ccTotal;

        output.push(elementOutput); // inserting the extracted data in the final output array

      };
    };

    subtotal.sickLeave = sickLeavesCounter;
    subtotal.sickRate = sickRatePercentage(subtotal.sickLeave, subtotal.employees);
    output.push(subtotal);
  };

  // run the function which will create the final table, based on the output (see below the function as is defined)
  generateReportTable(output);
};


// defining the function which will be ran last and will generate and display the table on the web page
// I won't go into detail here - it's basically used to generate each HTML element of the table: header, columns, rows and so on
function generateReportTable (output) {
  form.className = 'hiddenObject'; // hides the form

  var newTable = document.createElement('table');
  var headerLabels = ['No.', 'Cost Center', 'Description', 'Total employees', 'On medical leave', 'Sickness rate']

  var tableHead = document.createElement('thead');
  var tableBody = document.createElement('tbody');
  var headerRow = document.createElement('tr');

  for (let i = 0; i < headerLabels.length; i++) {
    var newHeaderCell = document.createElement('th');
    newHeaderCell.appendChild(document.createTextNode(headerLabels[i]));
    headerRow.appendChild(newHeaderCell);
  }

  tableHead.appendChild(headerRow);
  newTable.appendChild(tableHead);
  var counter = 1;

  for (let j = 0; j < output.length; j++) {
    var newDataRow = document.createElement('tr');

    if (output[j].description) {
      createTableElement('td', newDataRow, '');
      createTableElement('td', newDataRow, '');
      createTableElement('td', newDataRow, 'Total ' + output[j].description, 'cellDescription');
      createTableElement('td', newDataRow, output[j].employees, 'cellTotal');
      createTableElement('td', newDataRow, output[j].sickLeave || '-', 'cellSickness');
      if (output[j].sickRate != 0) {
        createTableElement('td', newDataRow, output[j].sickRate  + '%', 'cellSickRate');
      } else {
        createTableElement('td', newDataRow, '-', 'cellSickRate');
      }

      newDataRow.className = 'subtotal';
      counter = 1;

    } else {
      createTableElement('td', newDataRow, counter);
      createTableElement('td', newDataRow, output[j].ccNumber);
      createTableElement('td', newDataRow, output[j].ccDescription, 'cellDescription');
      createTableElement('td', newDataRow, output[j].ccTotal, 'cellTotal');
      createTableElement('td', newDataRow, output[j].ccSickLeave || '-', 'cellSickness');
      if (output[j].ccSickRate != 0) {
        createTableElement('td', newDataRow, output[j].ccSickRate + '%', 'cellSickRate');
      } else {
        createTableElement('td', newDataRow, '-', 'cellSickRate');
      }
      counter++;
    }

    tableBody.appendChild(newDataRow);

  }

  newTable.appendChild(tableBody);

  var container = document.getElementById('container');
  container.appendChild(newTable);
}

// a small function used to simplify generating the table
function createTableElement ( type, parent, content, cellClass ) {
  var newElement = document.createElement(type);
  if (cellClass) {
      newElement.className = cellClass;
  }
  newElement.appendChild(document.createTextNode(content));
  parent.appendChild(newElement);
}

// a small function for calculating sick rate percentage
function sickRatePercentage ( sick, total ) {
  return (sick / total * 100).toFixed(1);
}
