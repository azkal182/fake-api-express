import { faker } from '@faker-js/faker';
//import { faker } from '@faker-js/faker/locale/id_ID';

const listApi = [
	{
		category: 'person',
		subcategories: [
			'bio', 'firstName', 'fullName', 'gender', 'sex', 'jobArea', 'jobDescriptor',
			'jobTitle', 'jobType', 'lastName', 'middleName', 'prefix', 'sexType',
			'suffix', 'zodiacSign'
		]
	},
	{
		category: 'commerce',
		subcategories: [
			'department', 'price', 'product', 'productAdjective', 'productDescription',
			'productMaterial', 'productName'
		]
	},
	{
		category: 'location',
		subcategories: [
			'buildingNumber', 'cardinalDirection', 'city', 'country', 'countryCode', 'direction', 'latitude', 'longitude', 'nearbyGPSCoordinate',
			'ordinalDirection', 'secondaryAddress', 'state', 'street', 'streetAddress',
			'timeZone', 'zipCode'
		]
	}
];

function generateFaker(data) {
	//faker.locale = id_ID
	const elements = data.split('.');

	switch (elements[0].toLowerCase()) {
		case 'person':
			switch (elements[1].toLowerCase()) {
				case 'bio':
					return faker.person.bio()
					break;
				case 'firstname':
					return faker.person.firstName()
					break;
				case 'fullname':
					return faker.person.fullName()
					break;
				case 'gender':
					return faker.person.gender()
					break;
				case 'sex':
					return faker.person.sex()
					break;
				case 'jobarea':
					return faker.person.jobArea()
					break;
				case 'jobdescriptor':
					return faker.person.jobDescriptor()
					break;
				case 'jobtitle':
					return faker.person.jobTitle()
					break;
				case 'jobtype':
					return faker.person.jobType()
					break;
				case 'lastname':
					return faker.person.lastName()
					break;
				case 'middlename':
					return faker.person.middleName()
					break;
				case 'prefix':
					return faker.person.prefix()
					break;
				case 'sextype':
					return faker.person.sexType()
					break;
				case 'suffix':
					return faker.person.suffix()
					break;
				case 'zodiacsign':
					return faker.person.zodiacSign()
					break;
				default:
					console.log('person');
			}
			break;

		case "commerce":
			switch (elements[1].toLowerCase()) {
				case 'department':
					return faker.commerce.department()
					break;
				case 'price':
					return faker.commerce.price()
					break;
				case 'product':
					return faker.commerce.product()
					break;
				case 'productadjective':
					return faker.commerce.productAdjective()
					break;
				case 'productadjective':
					return faker.commerce.productAdjective()
					break;
				case 'productdescription':
					return faker.commerce.productDescription()
					break;
				case 'productmaterial':
					return faker.commerce.productMaterial()
					break;
				case 'productname':
					return faker.commerce.productName()
					break;

				default:
					return "commerce"
			}
			break;
		/*
		'buildingNumber', 'cardinalDirection', 'city', 'country', 'countryCode',
'county', 'direction', 'latitude', 'longitude', 'nearbyGPSCoordinate',
'ordinalDirection', 'secondaryAddress', 'state', 'street', 'streetAddress',
'timeZone', 'zipCode'
*/
		case "location":
			switch (elements[1].toLowerCase()) {
				case 'buildingnumber':
					return faker.location.buildingNumber()
					break;
				case 'cardinaldirection':
					return faker.location.cardinalDirection()
					break;
				case 'city':
					return faker.location.city()
					break;
				case 'country':
					return faker.location.country()
					break;
				case 'countrycode':
					return faker.location.countryCode()
					break;
				case 'direction':
					return faker.location.direction()
					break;
				case 'latitude':
					return faker.location.latitude()
					break;
				case 'longitude':
					return faker.location.longitude()
					break;
				case 'nearbygpscoordinate':
					return faker.location.nearbyGPSCoordinate()
					break;
				case 'ordinaldirection':
					return faker.location.ordinalDirection()
					break;
				case 'secondaryaddress':
					return faker.location.secondaryAddress()
					break;
				case 'state':
					return faker.location.state()
					break;
				case 'street':
					return faker.location.street()
					break;
				case 'streetaddress':
					return faker.location.streetAddress()
					break;
				case 'timezone':
					return faker.location.timeZone()
					break;
				case 'zipcode':
					return faker.location.zipCode()
					break;

				default:
					return "location"
			}
		default:
			return
		// code
	}
}


const generatorData = (scheme, count = 1) => {
	const data = scheme.scheme
	const result = [];

	for (let i = 0; i < count; i++) {
		let generatedData = {};
		for (const key of Object.keys(data)) {
			if (key !== "id") {
				const generatedValue = generateFaker(data[key]);
				generatedData[key] = generatedValue;
			} else {
				generatedData.id = i + 1
			}
		}
		result.push({ ...generatedData });

	}
	//	console.log(JSON.stringify({ [scheme.endpoint]: result }, null, 2))
	return { [scheme.endpoint]: result }
}


const data = {
	endpoint: "users",
	scheme: {
		name: "person.fullname",
		sex: "person.sex",
		bio: "person.bio",
		department: "commerce.department",
		productName: "commerce.productname",
		productPrice: "commerce.price"
	}
}

//generatorData(data, 3)

export { generatorData, listApi }