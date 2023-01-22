const Sauce = require('../models/sauce');
const fs = require('fs');
//{
//	userId: { type: String, required: true },
//	name: { type: String, required: true },
//	manutacture: { type: String, required: true },
//	description: { type: String, required: true },
//	mainPepper: { type: String, required: true },
//	imageUrl: { type: String, required: true },
//	heat: { type: Number, required: true },
//	likes: { type: Number, default: 0 },
//	dislikes: { type: Number, default: 0 },
//	usersLiked: { type: [String] },
//	usersDisliked: { type: [String] },
//}

//JSON at position 0.  Embedded JSON. Is this best working practices.
exports.createSauce = (req, res, next) => {
	const url = req.protocol + '://' + req.get('host');
 	const newSauce = JSON.parse(req.body.sauce);
	const sauce = new Sauce({
		userId: newSauce.userId,
		name: newSauce.name,
		description: newSauce.description,
		manufacturer: newSauce.manufacturer,
		mainPepper: newSauce.mainPepper,
		imageUrl: url + '/images/' + req.file.filename,
		heat: newSauce.heat,
	});
	sauce.save().then(() =>{
		res.status(201).json({
			message: 'Post saved'
		});
	}).catch((error) => {
		res.status(400).json({
			error: error
		});
	});	
};

exports.getOneSauce = (req, res, next) => {
	Sauce.findOne({
		_id: req.params.id
	}).then((sauce) => {
		res.status(200).json(sauce);
	}).catch((error) => {
		res.status(404).json({error: error})
	});
};

exports.getAllSauce = (req, res, next) => {
	Sauce.find().then((sauce) =>{
		res.status(200).json(sauce);
	}).catch((error) =>{
		res.status(400).json({error: error});
	});
};

//Embedded json when req.file.  Text file when !feq.file 
//Doesn't del img when changed.  Easy fix.  Del funtion has the code 
exports.modifySauce = (req, res, next) => {
	let sauce = new Sauce({_id: req.params._id})
	if (req.file){
		const url = req.protocol + '://' + req.get('host');
		const newSauce = JSON.parse(req.body.sauce);
		sauce = ({
			_id: req.params.id,
			userId: newSauce.userId,
			name: newSauce.name,
			description: newSauce.description,
			manufacturer: newSauce.manufacturer,
			mainPepper: newSauce.mainPepper,
			imageUrl: url + '/images/' + req.file.filename,
			heat: newSauce.heat,
		});
		/**
		Error was in the below
		unlink returns a promise so unlinkSync is used
		**/
		//fs.unlink ('images/' + newSauce.imageUrl);
		Sauce.findOne({_id: req.params.id}).then((oldSauce) => {
			const filename = oldSauce.imageUrl.split('/images/')[1];
			//fs.unlink('images/' + filename, () => {
			//	console.log('images/' + filename);
			//});
			fs.unlinkSync('images/' + filename);
		});
	} else{
		const newSauce = req.body;
		sauce = ({
			_id: req.params.id,
			userId: newSauce.userId,
			name: newSauce.name,
			description: newSauce.description,
			manufacturer: newSauce.manufacturer,
			mainPepper: newSauce.mainPepper,
			heat: newSauce.heat,
		});
	}
	Sauce.updateOne({_id: req.params.id}, sauce).then(()=> {
		res.status(201).json({
			message: 'Sauce updated'
		});
	}).catch((error) => {
		res.status(400).json({
			error: error
		});
	});
};

exports.deleteSauce = (req, res, next) =>{
	Sauce.findOne({_id: req.params.id}).then((sauce) => {
		
//fuck sake
		if (!sauce){
			return res.status(404).json({
				error: new Error('unknow')
			});
		}
		if (sauce.userId !== req.auth.userId){
			return res.status(400).json({
				error: new Error('unaitherized request')
			});
		}
				
		const filename = sauce.imageUrl.split('/images/')[1];
		fs.unlink ('images/' + filename, () => {
			Sauce.deleteOne({_id: req.params.id}).then(() => {
				res.status(200).json({
					message : 'del'
				});
			}).catch((error) => {
				res.status(400).json({
					error: error
				});
			});
		});
	});
};

//Taken from modifySauce 
//https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/includes
//https://www.mongodb.com/docs/manual/reference/operator/update/set/
//https://www.mongodb.com/docs/manual/reference/operator/update/inc/
//https://www.mongodb.com/docs/manual/reference/operator/update/push/
//https://www.mongodb.com/docs/manual/reference/operator/update/pull/
exports.likeSauce = (req, res, next) => {
	Sauce.findOne({_id: req.params.id}).then((sauce) => {
		if (req.body.like === 1){
			sauce.usersLiked.push(req.body.userId);
			likeSauce = ({
				likes: ++sauce.likes,
				usersLiked: sauce.usersLiked,
			});
		} else if(req.body.like === -1) {
			likeSauce = ({
				$push: { usersDisliked: req.body.userId },
				$inc: { dislikes: +1 },
			});
		} else if (req.body.like === -0 && sauce.usersLiked.includes(req.body.userId)){
			likeSauce = ({
				$pull: { usersLiked: req.body.userId },
				$inc: { likes: -1 },
			});
		} else if (req.body.like === -0 && sauce.usersDisliked.includes(req.body.userId)){
			likeSauce = ({
				$pull: { usersDisliked: req.body.userId },
				$inc: { dislikes: -1 },
			});
		} else {
			console.log('Likes are being hacked!  Sweet');
			res.status(201).json({
				message: 'opps'
			});
		}
		Sauce.updateOne({_id: req.params.id}, likeSauce).then(()=> {
		
			res.status(201).json({
				message: 'Sauce updated'
			});
		}).catch((error) => {
			res.status(400).json({
				error: error
			});
		});
	});
};
