
//#region ===== helper functions  //============================================================================================================================================================
const formatTime = (date) =>{
	const hours = date.getHours();
	const minutes = date.getMinutes();
	return `${hours.toString().padStart(2,'0')}:${minutes.toString().padStart(2,'0')}`;
};


const convertSecondToDate = (seconds) =>{
	return new Date(seconds * 1000); //API in seconden => * 1000 voor milli
};


const parseMilliseconds = (timestamp) =>{
	//Get hours from milliseconds
	const date = convertSecondToDate(timestamp);
	return formatTime(date);
};


const getBottomPercentage = (percentage)=>{
	return percentage < 50? percentage * 2 : (100 - percentage) * 2; //tot hoogste stand van de zon gaat het naar boven, daarna naar beneden
};


const letItBeNight = () =>{
	//console.log("Enable nightmode");
	document.querySelector('html').classList.add('is-night');
};


const BegoneNight = () =>{
	//console.log("Disable nightmode");
	document.querySelector('html').classList.remove('is-night');
};
//#endregion


//#region ===== 5 TODO: maak updateSun functie  //============================================================================================================================================================
const updateSun = (sun, sunLeft, sunBottom, now) => {
	sun.style.left = `${sunLeft}%`;
	sun.style.bottom = `${sunBottom}%`;

	const currentTimeStamp = formatTime(now);
	sun.setAttribute('data-time', currentTimeStamp);
};
//#endregion


//#region ===== 4 Zet de zon op de juiste plaats en zorg ervoor dat dit iedere minuut gebeurt.  //============================================================================================================================================================
const placeSunAndStartMoving = (totalMinutes, sunrise) => {
	const sunHTML = document.querySelector('.js-sun');
	const timeHTML = document.querySelector('.js-time-left');

	// ====================Bepaal het aantal minuten dat de zon al op is.=========================
	//Bepaal de huidige tijd (nu,staat al in datum formaat niet in seconden)
	const now = new Date();
	//Aantal minuten dat er al voorbij zijn op een dag.
	const minutesNow = (now.getHours() * 60 + now.getMinutes());
	
	//API info over zonsopgang omzetten van seconden naar datum
	const sunriseDate = convertSecondToDate(sunrise)
	//Aantal minuten dat er al voorbij zijn sinds de zon op is
	const minutesSunrise = (sunriseDate.getHours() * 60 + sunriseDate.getMinutes());

	//Verschil berekenen tussen aantal minuten over de HELE dag tov minuten sinds de zon op is vb. 1000 min - 720min(8u) => zon is al 280min op
	let minutesBeenUp = minutesNow - minutesSunrise; //let omdat later updaten

	//Totalminutes is het TOTAAL aantal minuten dat de zon op is op een dag. We doen dit minus het aantal uur dat de zon al op was om de resterende tijd te krijgen.
	//We gebruiken dit om het dark theme in te stellen. Zie lijn 84.
	const minutesLeft = totalMinutes - minutesBeenUp;

	//sunleft duwt de zon svg naar rechts naarmate het aantal minuten dat de zon op is groter wordt.
	const sunLeft = (minutesBeenUp/totalMinutes) * 100;
	//tot hoogste stand van de zon gaat het naar boven, daarna naar beneden. Vanaf sunleft meer dan 50% is gaat het omlaag.
	const sunBottom = getBottomPercentage(sunLeft); 

	// Zet initiële goede positie zon
	updateSun(sunHTML, sunLeft, sunBottom, now);

	// Voeg de 'is-loaded' class toe aan de body-tag.
	document.body.classList.add('is-loaded');

	// Vul het resterende aantal minuten in.
	let minutesLeftDisplay = Math.floor(minutesLeft);
	if(minutesLeftDisplay < 0)
		minutesLeftDisplay = 0;
	timeHTML.innerHTML = minutesLeftDisplay;

	// Bekijk of de zon niet nog onder of reeds onder is
	if(minutesBeenUp > totalMinutes || minutesBeenUp < 0)
	{
		letItBeNight();
	}

	// Updaten zon elke minuut (wordt pas na 1 minuut gestart)
	const t = setInterval(() => {
		console.log("checkSun");
		if(minutesBeenUp > totalMinutes)
		{
			//clearInterval(t);
			letItBeNight();
		}
		else if(minutesBeenUp < 0)
		{
			letItBeNight();
		}
		else
		{
			BegoneNight();
	
			// Zon updaten via de updateSun functie.
			const now = new Date();
			const left = (minutesBeenUp/totalMinutes) * 100; //Zelfde als sunleft formule als lijn 75
			const bottom = getBottomPercentage(left);
	
			// Update resterend aantal minuten en verhoog aantal verstreken minuten.
			updateSun(sunHTML, left, bottom, now);
			minutesBeenUp++; // +1 increment aan aantal minuten dat de zon op is toevoegen.
		}	
	}
	,60000); // 60 000 => IEDERE MINUUT
};
//#endregion


//#region ===== 3 Met de data van de API kunnen we de app opvullen  //============================================================================================================================================================
const showResult = queryResponse => {
	console.log(queryResponse);
	// Geef locatie weer
	const locatieHTML = document.querySelector('.js-location');
	const stad = queryResponse.city.name;
	const country = queryResponse.city.country;
	locatieHTML.innerText = `${stad}, ${country}`;

	// Toon  tijd voor de zonsopkomst en -ondergang
	const sunriseHTML = document.querySelector('.js-sunrise');
	const sunrise = queryResponse.city.sunrise;
	const sunriseText = parseMilliseconds(sunrise);
	sunriseHTML.innerText = sunriseText;

	const sunsetHTML = document.querySelector('.js-sunset');
	const sunset = queryResponse.city.sunset;
	const sunsetText = parseMilliseconds(sunset);
	sunsetHTML.innerText = sunsetText;

	// Geef zon positie en update
	// Geef de periode tussen sunrise en sunset en het tijdstip van sunrise mee
	const timeDifference = ((sunset - sunrise) / 60); //API staat seconden -> /60 voor minuten
	placeSunAndStartMoving(timeDifference, sunrise);
};
//#endregion


//#region ===== 2 Aan de hand van een longitude en latitude gaan we de yahoo wheater API ophalen.  //

const getAPI = async (lat, lon) => {

	// Eerst bouwen we onze url op
	// 22a419c3df1cc87272ab9ace10fddcfc => Dit plakken in url te vinden op leho

	// Met de fetch API proberen we de data op te halen.		
	const data = await fetch(`http://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=22a419c3df1cc87272ab9ace10fddcfc
	&units=metric&lang=nl&cnt=1`)
			.then((r) =>r.json())
			.catch((err) => console.error('an error occurred', err))
		console.log(data)

	// Als dat gelukt is, gaan we naar onze showResult functie.
	showResult(data)
};

//#endregion


document.addEventListener('DOMContentLoaded', function() {
	// 1 We will query the API with longitude and latitude.
	getAPI(50.8027841, 3.2097454);
});
