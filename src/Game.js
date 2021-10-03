import { Simulation } from './Simulation.js';
import { TimeAndDate } from './TimeAndDate.js';
import { orangeGovernors } from './Governors.js';
import { Storm } from './Weather.js';

class Game {
	constructor(ui) {
		this.ui = ui;
		this.simulation = new Simulation();
		this.gameState = new GameState();
		
		this.orangeGovernor = true; // TODO: make this dynamic or something
		this.currentGovernorIndex = 0;
		
		this.ui.startup = this.startGame.bind(this);
		
		this.ui.elements.resignButton.onclick = this.resignGovernor.bind(this);
	}
	
	startGame() {
		this.updateUI();
		this.ui.setupRegions(this.simulation);
		this.ui.showInGameModal(
			"🌨 It's gonna be a cold one",
			"As your first important decision as Goobernor this year, your cronies on the energy committee want to know if they should require the power plants to get ready for the winter storm that's coming in. Experts are warning that it might dip below freezing. Your political donors are warning that you should never trust experts, and that they'll donate more to your reelection campaign if they aren't forced to winterize.", 
			"Prepare? Nah. Money is for politicians, not power plants.", 
			this.skipWinterization.bind(this), 
			"Better safe than sorry. Winterize the power plants.", 
			this.winterize.bind(this)
		);
	}
	
	skipWinterization() {
		this.simulation.gridWinterized = false;
		this.simulation.donations.applyEnergyDonations(false, this.orangeGovernor);
		this.ui.clearInGameModal();
		this.ui.showInGameModal(
			"💰 Money money money",
			"Your friends who own the power plants send a cool million your way as thanks for the complete lack of regulations. Energy companies in Tegzit can charge $9000 during a shortage for a unit of electricity that would normally cost $50, and love to share with the politicians who allow those shortages to happen.", 
			"Cool! In Tegzit, political donations don't count as bribes.", 
			this.continueGame.bind(this)
		);
	}
	
	winterize() {
		this.simulation.gridWinterized = true;
		this.simulation.donations.applyEnergyDonations(true, this.orangeGovernor);
		this.ui.clearInGameModal();
		this.ui.showInGameModal(
			"💸 Tsk tsk",
			"\"I thought I could count on the great state of Tegzit to be friendly to my business instead of telling me what to do,\" says your friend who owns a power plant. You're going to have a harder time raising money for your reelection campaign if you keep this up.", 
			"Oh", 
			this.continueGame.bind(this)
		);
	}
	
	continueGame() {
		this.ui.clearInGameModal();
		this.updateUI();
		
		this.gameState.timeAndDate.startTime(this.updateDate.bind(this), this.hourlyUpdate.bind(this), this.dailyUpdate.bind(this));
	}
	
	hourlyUpdate() {
		if (this.gameState.timeAndDate.hour == 9) {
			this.gameState.storm.regenerateTemps(); // calculate new day's temps at 9
		}
		let temperature = this.gameState.storm.calculateTemperatureAtHour(this.gameState.timeAndDate.hour);
		
		const hourlyGazzUsage = this.simulation.hourTick(temperature, this.orangeGovernor);
		this.simulation.donations.applyGazzDonations(hourlyGazzUsage, this.orangeGovernor);
		this.ui.outputs.gazzUsage.textContent = Math.round(hourlyGazzUsage);
		
		this.simulation.donations.applyPurpleGrassrootsDonations(this.simulation.getPurplePopulation(), this.simulation.getAvgPurpleApprovalRating());
		
		this.updateUI();
		this.ui.updateRegions(this.simulation);
	}
	
	dailyUpdate() {
		// TODO: some kind of dialog box or something?
		const generatorPurchases = this.simulation.buyGenerators();
		this.simulation.donations.applyGeneratorDonations(generatorPurchases, this.orangeGovernor);
		this.simulation.applyEnergyDonations(this.simulation.gridWinterized, this.orangeGovernor);
	}
	
	updateUI() {
		const temperature = this.gameState.storm.calculateTemperatureAtHour(this.gameState.timeAndDate.hour);
		
		this.ui.outputs.governorName.textContent = orangeGovernors[this.currentGovernorIndex];
		this.ui.outputs.orangeFunds.textContent = this.simulation.donations.getOrangeDonations();
		this.ui.outputs.purpleFunds.textContent = this.simulation.donations.getPurpleDonations();
		this.ui.outputs.date.textContent = this.gameState.timeAndDate.getFriendlyString();
		this.ui.outputs.temperature.textContent = Math.round(temperature);
		this.ui.outputs.gridStability.textContent = Math.round(this.simulation.getAvailablePowerRatio(temperature) * 100);
		this.ui.outputs.genDemand.textContent = `${this.simulation.getGenDemandPop()}`;
		this.ui.outputs.genCount.textContent = this.simulation.getGenCount();
		this.ui.outputs.gazzIndustryDonations.textContent = this.simulation.donations.gazzIndustryDonations;
		this.ui.outputs.generatorIndustryDonations.textContent = this.simulation.donations.generatorIndustryDonations;
		this.ui.outputs.energyIndustryDonations.textContent = this.simulation.donations.energyIndustryDonations;
		this.ui.outputs.populationFields.forEach(function(field) {
			field.textContent = this.simulation.getPopulation();
		}.bind(this));
		this.ui.outputs.popApproval.textContent = this.simulation.getAvgPurpleApprovalRating();
		this.ui.outputs.popInDanger.textContent = this.simulation.getPopulationInDanger();
		// TODO: the percent change figures
	}
	
	updateDate() {
		this.ui.outputs.date.textContent = this.gameState.timeAndDate.getFriendlyString();
	}
	
	resignGovernor() {
		this.gameState.timeAndDate.stopTime(); // pause for now
		
		const exitingGovernorName = orangeGovernors[this.currentGovernorIndex];
		
		this.currentGovernorIndex += 1;
		if (this.currentGovernorIndex >= orangeGovernors.length) {
			this.currentGovernorIndex = 0;
		}
		
		const newGovernorName = orangeGovernors[this.currentGovernorIndex];
		
		this.ui.showInGameModal(
			`Goobernor ${exitingGovernorName} Resigns`, 
			`The Goobernor of Tegzit, ${exitingGovernorName}, has resigned in disgrace. Lootenant Goobernor ${newGovernorName} steps in to take the empty seat.`, 
			'Ok.', 
			this.continueGame.bind(this)
		);
	}
}

class GameState {
	constructor() {
		this.timeAndDate = new TimeAndDate(0, 13);
		this.storm = new Storm();
	}
}

export { Game };