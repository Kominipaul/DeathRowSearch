
document.getElementById('help-trigger').addEventListener('click', () => {
    //document.getElementById('dialog-result').innerText = ''
    document.getElementById('help').showModal()
})

document.getElementById('help').addEventListener('close', (event) => {
    //document.getElementById('dialog-result').innerText = `Your answer: ${event.target.returnValue}`
})


// Get the input element
const searchInput = document.getElementById('search');

// Add an event listener for the 'keypress' event
searchInput.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
        const searchTerm = searchInput.value;

        // Call the API with the search term as a query parameter
        fetch(`/api/statements?searchTerm=${encodeURIComponent(searchTerm)}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                const resultsContainer = document.getElementById('results'); // Assuming a container with ID 'results'
                resultsContainer.innerHTML = ''; // Clear previous results

                // Populate the results container with fetched data
                data.forEach(person => {
                    // Create the card element
                    const card = document.createElement('div');
                    card.classList.add('card');

                    // Add MugShot
                    const mugShotDiv = document.createElement('div');
                    mugShotDiv.classList.add('MugShot');
                    const mugShotImg = document.createElement('img');
                    mugShotImg.src = 'https://avatars.githubusercontent.com/u/40539574?v=4'; // Replace with dynamic image source if available
                    mugShotImg.alt = 'Mug_Shot';
                    mugShotDiv.appendChild(mugShotImg);

                    // Add Last Statement
                    const lastS = document.createElement('div');
                    lastS.classList.add('lastS');
                    const statementPara = document.createElement('p');
                    statementPara.classList.add('text');
                    statementPara.textContent = person._source.LastStatement;

                    // Add basic details
                    const detailsPara = document.createElement('p');
                    detailsPara.classList.add('text');
                    detailsPara.textContent = `Name: ${person._source.FirstName} ${person._source.LastName}, Age: ${person._source.Age}, Race: ${person._source.Race}, County of Conviction: ${person._source.CountyOfConviction}`;

                    // Append paragraphs to the lastS div
                    lastS.appendChild(statementPara);
                    lastS.appendChild(detailsPara);

                    // Append all to the card
                    card.appendChild(mugShotDiv);
                    card.appendChild(lastS);

                    // Append the card to the results container
                    resultsContainer.appendChild(card);
                });
            })
            .catch(error => {
                console.error('Error fetching data:', error);
            });
    }
});
