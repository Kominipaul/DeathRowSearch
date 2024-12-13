function closeHelp() {
    const helpDialog = document.getElementById('help');
    if (helpDialog) {
        helpDialog.close();
    }
}

document.getElementById('help-trigger').addEventListener('click', () => {
    document.getElementById('help').showModal();
});

document.getElementById('help').addEventListener('close', (event) => {
    // Optional: Handle dialog close event
});

document.getElementById('help-trigger').addEventListener('click', () => {
    document.getElementById('help').showModal();
});

document.getElementById('help').addEventListener('close', (event) => {
    // Optional: Handle dialog close event
});

const searchInput = document.getElementById('search');
const addinput = document.getElementById('add');
let currentOffset = 0;
const pageSize = 10;
let hasMoreResults = true; // Variable to track if there are more results

// Function to fetch and display results
async function fetchResults(filter, append = false) {
    try {
        const response = await fetch(`/api/queries?filter=${encodeURIComponent(filter)}&from=${currentOffset}&size=${pageSize}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        const resultsContainer = document.getElementById('results');

        if (!append) {
            resultsContainer.innerHTML = ''; // Clear previous results if not appending
        }

        if (data.length === 0 && !append) {
            resultsContainer.innerHTML = '<p>No results found.</p>';
            // Disable "Show More" if no results are found
            document.getElementById('show-more').disabled = true;
            document.getElementById('show-more').innerText = 'No more results';
            hasMoreResults = false;
            return;
        } else if (data.length === 0) {
            // Disable "Show More" if no more results
            document.getElementById('show-more').disabled = true;
            document.getElementById('show-more').innerText = 'No more results';
            hasMoreResults = false;
            return;
        }

        // Populate the results container with fetched data
        // Populate the results container with fetched data
        data.forEach(person => {
            // Create the card element
            const card = document.createElement('div');
            card.classList.add('card');
        
            // Add MugShot and Basic Info
            const cardHeader = document.createElement('div');
            cardHeader.classList.add('card-header');
        
            const mugShotDiv = document.createElement('div');
            mugShotDiv.classList.add('mugshot');
            const mugShotImg = document.createElement('img');
            mugShotImg.src = `https://www.tdcj.texas.gov/death_row/dr_info/${person._source.LastName}${person._source.FirstName}2.jpg`;
            mugShotImg.onerror = () => {
                mugShotImg.src = 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png';
            };
            mugShotImg.alt = 'Mug_Shot';
            mugShotImg.classList.add('mugshot-img');
            mugShotDiv.appendChild(mugShotImg);
        
            const cardDetails = document.createElement('div');
            cardDetails.classList.add('card-details');
            const name = document.createElement('h3');
            name.textContent = `${person._source.FirstName} ${person._source.LastName}`;
            const ageRace = document.createElement('p');
            ageRace.textContent = `Age: ${person._source.Age} | Race: ${person._source.Race}`;
            const county = document.createElement('p');
            county.textContent = `County of Conviction: ${person._source.CountyOfConviction}`;
            const tdcjNumber = document.createElement('p');
            tdcjNumber.textContent = `TDCJ Number: ${person._source.TDCJNumber}`;
        
            cardDetails.appendChild(name);
            cardDetails.appendChild(ageRace);
            cardDetails.appendChild(county);
            cardDetails.appendChild(tdcjNumber);
        
            cardHeader.appendChild(mugShotDiv);
            cardHeader.appendChild(cardDetails);
        
            const buttonDiv = document.createElement('div');
            buttonDiv.classList.add('button-div');
            
            // Delete Button
            const deleteButton = document.createElement('button');
            deleteButton.textContent = 'Delete';
            deleteButton.classList.add('delete-button');
        
            // Add the delete functionality when the button is clicked
            deleteButton.onclick = () => deleteRecord(person._source.TDCJNumber, card);
        
            // Edit Button
            const editButton = document.createElement('button');
            editButton.textContent = 'Edit';
            editButton.classList.add('edit-button');
            editButton.onclick = () => openEditField(person._source.TDCJNumber, card);
        
            card.appendChild(cardHeader);
            
            // Add Additional Details
            const additionalDetails = document.createElement('div');
            additionalDetails.classList.add('additional-details');
            const additionalList = document.createElement('ul');
            const details = [
                { label: "Execution", value: person._source.Execution },
                { label: "Age When Received", value: person._source.AgeWhenReceived },
                { label: "Education Level", value: person._source.EducationLevel },
                { label: "Native County", value: person._source.NativeCounty },
                { label: "Previous Crime", value: person._source.PreviousCrime },
                { label: "Codefendants", value: person._source.Codefendants },
                { label: "Number of Victims", value: person._source.NumberVictim },
                { label: "White Victim", value: person._source.WhiteVictim },
                { label: "Hispanic Victim", value: person._source.HispanicVictim },
                { label: "Black Victim", value: person._source.BlackVictim },
                { label: "Victim of Other Races", value: person._source.VictimOtherRaces },
                { label: "Female Victim", value: person._source.FemaleVictim },
                { label: "Male Victim", value: person._source.MaleVictim },
            ];
        
            details.forEach(detail => {
                const listItem = document.createElement('li');
                listItem.innerHTML = `<strong>${detail.label}:</strong> ${detail.value}`;
                additionalList.appendChild(listItem);
            });
        
            additionalDetails.appendChild(additionalList);
        
            // Add Last Statement
            const lastStatement = document.createElement('div');
            lastStatement.classList.add('last-statement');
            const statementHeading = document.createElement('h4');
            statementHeading.textContent = 'Last Statement';
            const statementPara = document.createElement('p');
            statementPara.textContent = person._source.LastStatement;
        
            lastStatement.appendChild(statementHeading);
            lastStatement.appendChild(statementPara);
        
            // Append everything to the card
            card.appendChild(cardHeader);
            card.appendChild(additionalDetails);
            card.appendChild(lastStatement);

            // Append the card to the results container
            resultsContainer.appendChild(card);            
            // Add the buttons to the button button-div
            card.appendChild(buttonDiv);
            buttonDiv.appendChild(deleteButton);
            buttonDiv.appendChild(editButton);
        
            // Function to open the edit field
            function openEditField(tdcjNumber, card) {
                // Check if the input field already exists
                if (card.querySelector('.edit-field')) return;
        
                // Create input field, save button, and delete button
                const editField = document.createElement('div');
                editField.classList.add('edit-field');
        
                const input = document.createElement('input');
                input.type = 'text';
                input.placeholder = 'Enter updates, e.g., Age = 100, Race = "White"';
        
                const saveButton = document.createElement('button');
                saveButton.textContent = 'Save';
                saveButton.classList.add('save-button');
                saveButton.onclick = () => saveEdit(tdcjNumber, input.value, card);
        
                const CancelButton = document.createElement('button');
                CancelButton.textContent = 'Cancel';
                CancelButton.classList.add('cancel-button');
                CancelButton.onclick = () => card.removeChild(editField);
        
                editField.appendChild(input);
                editField.appendChild(saveButton);
                editField.appendChild(CancelButton);
        
                card.appendChild(editField);
            }
        
            
            async function deleteRecord(tdcjNumber, card) {
                const fullCommand = `TDCJ = ${tdcjNumber}`;

                try {
                    // Sending the DELETE request to the server with the command
                    const response = await fetch('/api/delete', {
                        method: 'DELETE',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ command: fullCommand })
                    });

                    // Check if the response is successful
                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }

                    // Show success message
                    alert('Record deleted successfully!');

                    // Debugging: Check if the card element is valid
                    console.log('Card element:', card);
                    card.remove();
                } catch (error) {
                    // Handle any errors during the deletion process
                    console.error('Error deleting record:', error);
                    alert('Failed to delete the record. Please try again.');
                }
            }
        
            // Save Edit Function
            async function saveEdit(tdcjNumber, command, card) {
                if (!command.trim()) {
                    alert('Please enter a valid command.');
                    return;
                }
        
                const fullCommand = `TDCJ = ${tdcjNumber} (${command});`;
        
                try {
                    const response = await fetch('/api/edit', {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ command: fullCommand })
                    });
        
                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }
        
                    alert('Record updated successfully!');
                    card.querySelector('.edit-field').remove(); // Remove the input field after saving
                    fetchResults(searchInput.value); // Refresh the results
                } catch (error) {
                    console.error('Error saving edit:', error);
                    alert('Failed to save changes. Please try again.');
                }
            }
        });
    }
    catch (error) {
        console.error('Error fetching data:', error);
    }
}



// Add an event listener for the 'keypress' event on the search input
searchInput.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
        currentOffset = 0; // Reset pagination
        hasMoreResults = true; // Reset the "no more results" flag
        fetchResults(searchInput.value, false);
    }
});

addinput.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
        const fullName = addinput.value.trim();
        
        if (fullName) {
            // Split the name into last name and first name
            const [lastName, firstName] = fullName.split(' ').map(part => part.trim());
            if (lastName && firstName) {
                // Create a dynamic URL using the last name and first name
                const name = `${lastName.toLowerCase()}${firstName.toLowerCase()}`;
                const url = `https://thingproxy.freeboard.io/fetch/https://www.tdcj.texas.gov/death_row/dr_info/${name}.html`;
                fetch(url)
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`HTTP error! Status: ${response.status}`);
                    }
                    return response.text();
                })
                .then(html => {
                    const parser = new DOMParser();
                    const doc = parser.parseFromString(html, 'text/html');
    
                    const cells = Array.from(doc.querySelectorAll("td"));
                    const nameIndex = cells.findIndex(cell => cell.textContent.trim() === "Name");
    
                    if (nameIndex !== -1) {
                        var fullName = cells[nameIndex + 1].textContent.trim();
                        var [lastName, firstName] = fullName.split(',').map(part => part.trim());
                        var [firstName, fullName] = firstName.split(' ').map(part => part.trim());
    
                        const tdcjNumber = getDataFromTable(cells, "TDCJ Number");
                        const dob = getDataFromTable(cells, "Date of Birth");
                        const dateReceived = getDataFromTable(cells, "Date Received");
                        const ageWhenReceived = getDataFromTable(cells, "Age (when Received)");
                        const educationLevel = getDataFromTable(cells, "Education Level (Highest Grade Completed)");
                        const dateOfOffense = getDataFromTable(cells, "Date of Offense");
                        const ageAtOffense = getDataFromTable(cells, "Age (at the time of Offense)");
                        const county = getDataFromTable(cells, "County");
                        const race = getDataFromTable(cells, "Race");
                        const gender = getDataFromTable(cells, "Gender");
                        const hairColor = getDataFromTable(cells, "Hair Color");
                        const height = getDataFromTable(cells, "Height (in Feet and Inches)");
                        const weight = getDataFromTable(cells, "Weight (in Pounds)");
                        const eyeColor = getDataFromTable(cells, "Eye Color");
                        const nativeCounty = getDataFromTable(cells, "Native County");
                        const nativeState = getDataFromTable(cells, "Native State");
    
                        const data = {
                            firstName: firstName,
                            lastName: lastName,
                            tdcjNumber: tdcjNumber,
                            dob: dob,
                            dateReceived: dateReceived,
                            ageWhenReceived: ageWhenReceived,
                            educationLevel: educationLevel,
                            dateOfOffense: dateOfOffense,
                            ageAtOffense: ageAtOffense,
                            county: county,
                            race: race,
                            gender: gender,
                            hairColor: hairColor,
                            height: height,
                            weight: weight,
                            eyeColor: eyeColor,
                            nativeCounty: nativeCounty,
                            nativeState: nativeState
                        };
    
                          // Fetch the last statement from the second page
                        const lastStatementUrl = `https://thingproxy.freeboard.io/fetch/https://www.tdcj.texas.gov/death_row/dr_info/${name}last.html`;

                        fetch(lastStatementUrl)
                            .then(response => {
                                if (!response.ok) {
                                    throw new Error(`HTTP error! Status: ${response.status}`);
                                }
                                return response.text();
                            })
                            .then(lastHtml  => {
                                const lastStatementDoc = new DOMParser().parseFromString(lastHtml, 'text/html');
                               
                                const contentRightDiv = lastStatementDoc.querySelector("#content_right");//div that last statement is in
                                if (contentRightDiv) {
                               
                                    const paragraphs = contentRightDiv.querySelectorAll("p");
                                    
                                    if (paragraphs.length >= 2) {
                                        // Get the second-to-last p element
                                        const secondToLastStatement = paragraphs[paragraphs.length - 2];
                                        
                                        if (secondToLastStatement) {
                                            const lastStatementText = secondToLastStatement.textContent.trim();
                                            data.lastStatement = lastStatementText;
                                        } else {
                                            data.lastStatement = "Second-to-last statement not found";
                                        }
                                    }
                                }
                                
                                console.log(JSON.stringify(data, null, 2));
                           
                            })
                            .catch(error => console.error("Error fetching last statement:", error));
                    } else {
                        console.error("Name field not found.");
                    }
                })
                .catch(error => console.error("Error:", error));
        }
        }
    }
});

function getDataFromTable(cells, label) {
    const index = cells.findIndex(cell => cell.textContent.trim() === label);
    return index !== -1 ? cells[index + 1].textContent.trim() : "Not found";
}


// Add "Show More" functionality
document.getElementById('show-more').addEventListener('click', () => {
    if (hasMoreResults) {
        currentOffset += pageSize; // Increment the offset
        fetchResults(searchInput.value, true); // Append results
    }
});
