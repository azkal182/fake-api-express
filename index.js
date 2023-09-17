import express from 'express'
import bcrypt from 'bcrypt'
import cors from "cors"
import jwt from 'jsonwebtoken'
import { MongoClient, ObjectId } from 'mongodb'
import { generatorData, listApi } from "./generator.js"
const app = express();
app.use(cors())

const mongoUrl = 'mongodb+srv://azkal:Azkal182@cluster0.tsc6itl.mongodb.net/?retryWrites=true&w=majority'; // Sesuaikan dengan URL MongoDB Anda
const dbName = 'demo-db'; // Ganti dengan nama basis data Anda
const client = new MongoClient(mongoUrl);

const secretKey = 'bxkgdkgdgkdkgjg8y86868tptuurlu'; // Gantilah dengan kunci rahasia yang aman

// Middleware untuk memproses JSON
app.use(express.json());

// Endpoint untuk registrasi pengguna baru
app.get('/', (req,res)=>{
	res.json({status:'ok'})
})
app.post('/register', async (req, res) => {
	try {
		const { username, password, name } = req.body;
		const hashedPassword = await bcrypt.hash(password, 10);

		await client.connect();
		const db = client.db(dbName);
		const usersCollection = db.collection('users');
		const newUser = {
			name,
			username,
			password: hashedPassword,
		};
		const userExist = await usersCollection.findOne({username});
		if (userExist) {
			res.status(409).json({message:'username tidak tersedia'})
			return 
		}
		const result = await usersCollection.insertOne(newUser);
		
		const token = jwt.sign({ userId: result.insertedId }, secretKey, { algorithm: 'HS256', expiresIn: '1d' });
		res.cookie('token', token, {
			httpOnly: true,
			maxAge: 24 * 30 * 60 * 60 * 1000
		})
		

		res.status(201).json({ message: 'Registrasi berhasil', userId: result.insertedId , accessToken:token});
	} catch (error) {
		console.error(error);
		res.status(500).json({ error: 'Terjadi kesalahan saat registrasi' });
	}
});

// Endpoint untuk login
app.post('/login', async (req, res) => {
	try {
		const { username, password } = req.body;

		await client.connect();
		const db = client.db(dbName);
		const usersCollection = db.collection('users');
		const user = await usersCollection.findOne({ username });

		if (!user) {
			return res.status(401).json({ errors: { message: 'Username tidak ditemukan' } });
		}

		const passwordMatch = await bcrypt.compare(password, user.password);

		if (!passwordMatch) {
			return res.status(401).json({ errors: { message: 'Username atau password salah' } });
		}

		const token = jwt.sign({ userId: user._id }, secretKey, { algorithm: 'HS256', expiresIn: '1d' });
		res.cookie('token', token, {
			httpOnly: true,
			maxAge: 24 * 30 * 60 * 60 * 1000
		})
		res.status(200).json({ ...user, accessToken:token });
	} catch (error) {
		console.error(error);
		res.status(500).json({ error: 'Terjadi kesalahan saat login' });
	}
});

app.get('/users/current', protectRoute, async (req, res) => {
	try {
		const { username, password } = req.body;

		await client.connect();
		const db = client.db(dbName);
		const usersCollection = db.collection('users');
		const userId = new ObjectId(req.userId)
		const user = await usersCollection.findOne({ _id: userId });


		res.status(200).json({ user });
	} catch (error) {
		console.error(error);
		res.status(500).json({ error: 'Terjadi kesalahan saat login' });
	}
});

// Middleware untuk melindungi rute tertentu dengan token
function protectRoute(req, res, next) {

	const authHeader = req.headers['authorization']
	const token = authHeader && authHeader.split('Bearer ')[1]


	//const token ="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2NTAzNzc5M2IxMzJjODZjNjcyNmJiNzAiLCJpYXQiOjE2OTQ3NTk5MDUsImV4cCI6MTY5NDg0NjMwNX0.tEJ4ZhbL0JTCdTRMp9-DRcojIn-yb4Y8pcxDg8Hxnmg"

	if (!token) {
		return res.status(401).json({ error: 'Akses ditolak. Token tidak ditemukan.' });
	}

	try {
		//	console.log({token,gettoken})
		const decoded = jwt.verify(token, secretKey);
		req.userId = decoded.userId;
		next();
	} catch (error) {
		res.status(401).json({ error: 'Akses ditolak. Token tidak valid.' });
	}
}

// Contoh penggunaan middleware protectRoute
app.post('/projects', protectRoute, async (req, res) => {
	const { name } = req.body;
	await client.connect();
	const db = client.db(dbName);
	const usersCollection = db.collection('projects');

	const result = await usersCollection.insertOne({ userId: req.userId, name });

	res.status(200).json({ message: 'Rute dilindungi', userId: req.userId });
});

app.delete('/projects/:projectId', protectRoute, async (req, res) => {
	const {projectId} = req.params
	
	try {
		await client.connect();
	const db = client.db(dbName);
	const objectProjectId = new ObjectId(projectId)
	const usersCollection = db.collection('projects');

	const result = await usersCollection.deleteOne({ _id:  objectProjectId});

	res.status(200).json({ message: 'project berhasil dihapus' });
	} catch (e) {
		res.status(500).json({ message: 'gagal menghapus projects' });
	}
});

app.get('/projects/:projectId', protectRoute, async (req, res) => {
	const {projectId} = req.params
	
	try {
		await client.connect();
	const db = client.db(dbName);
	const objectProjectId = new ObjectId(projectId)
	const usersCollection = db.collection('projects');

	const result = await usersCollection.findOne({ _id:  objectProjectId});

	res.status(200).json({  result});
	} catch (e) {
		res.status(500).json({ message: 'gagal mendapatkan projects' });
	}
});

//route for create resource by id project 
app.post('/projects/:projectId/resources', protectRoute, async (req, res) => {
	const { projectId } = req.params;
	const data = req.body
	console.log(data)
	await client.connect();
	const db = client.db(dbName);
	const usersCollection = db.collection('resources');

	const checkData = await usersCollection.find({ projectId, endpoint: req.body.endpoint }).toArray();

	if (checkData.length > 0) {
		res.status(409).json({ errors: { message: 'endpoint sudah ada' } });
	} else {

		const result = await usersCollection.insertOne({
			userId: req.userId,
			projectId, ...req.body
		});

		res.status(200).json({ message: 'Rute dilindungi', result });
	}

});
//route for update resource by id resource
app.put('/projects/:projectId/resources/:resourceId', protectRoute, async (req, res) => {
	const { projectId, resourceId } = req.params;
	const updatedData = req.body;

	try {
		// Mengubah resourceId menjadi ObjectId
		const resourceObjectId = new ObjectId(resourceId);

		await client.connect();
		const db = client.db(dbName);
		const resourcesCollection = db.collection('resources');

		const existingResource = await resourcesCollection.findOne({
			_id: resourceObjectId,
			projectId,
		});

		if (!existingResource) {
			return res.status(404).json({ message: 'Data tidak ditemukan' });
		}

		// Melakukan pembaruan data
		const result = await resourcesCollection.updateOne(
			{
				_id: resourceObjectId,
				projectId,
			},
			{ $set: { userId: req.userId, projectId, ...updatedData } }
		);

		if (result.modifiedCount === 1) {
			res.status(200).json({ message: 'Data berhasil diperbarui' });
		} else {
			res.status(500).json({ error: 'Gagal memperbarui data' });
		}
	} catch (error) {
		console.error(error);
		res.status(500).json({ error: 'Terjadi kesalahan saat memperbarui data' });
	}
});

//route for list resource by id project
app.get('/projects/:projectId/resources', protectRoute, async (req, res) => {
	const { projectId } = req.params;

	await client.connect();
	const db = client.db(dbName);
	const usersCollection = db.collection('resources');

	const result = await usersCollection.find({
		projectId
	}).toArray();


	res.status(200).json({ message: 'Rute dilindungi', result });

});

//route for delete resource by id resource
app.delete('/projects/:projectId/resources/:resourceId', protectRoute, async (req, res) => {
	const { projectId, resourceId } = req.params;

	try {
		// Mengubah resourceId menjadi ObjectId
		const resourceObjectId = new ObjectId(resourceId);

		await client.connect();
		const db = client.db(dbName);
		const resourcesCollection = db.collection('resources');

		const result = await resourcesCollection.deleteOne({
			_id: resourceObjectId
		});

		if (result.deletedCount === 1) {
			res.status(200).json({ message: 'Data berhasil dihapus' });
		} else {
			res.status(404).json({ message: 'Data tidak ditemukan' });
		}
	} catch (error) {
		console.error(error);
		res.status(500).json({ error: 'Terjadi kesalahan saat menghapus data' });
	}
});

app.get('/projects/:projectId/resources/:resourceId/generate', protectRoute, async (req, res) => {
	const count = req.query.count ?? 1
	const { projectId, resourceId } = req.params;

	try {
		await client.connect();
		const db = client.db(dbName);
		const resourcesCollection = db.collection('resources');
		const resourcesProjectCollection = db.collection('resource-project');

		const resourceObjectId = new ObjectId(resourceId)
		//const projectObjectId = new ObjectId(projectId)

		const existingProjectResource = await resourcesProjectCollection.findOne({
			projectId,
		});

		const existingResource = await resourcesCollection.findOne({
			_id: resourceObjectId,
			projectId,
		});




		if (!existingResource) {
			return res.status(404).json({ message: 'Data tidak ditemukan' });
		}



		const generated = generatorData(existingResource, count)

		//console.log(generated)

		if (!existingProjectResource) {
			//buat data baru projects resources 

			await resourcesProjectCollection.insertOne({
				projectId,
				...generated
			});
			await resourcesCollection.updateOne({
				_id: resourceObjectId
			}, {
				$set: { count }
			})

			return res.status(200).json({ success: 'fake data berhasil dibuat' });
		}
		//update data baru

		existingProjectResource[existingResource.endpoint] = generated[existingResource.endpoint]

		await resourcesProjectCollection.updateOne({
			projectId
		}, { $set: existingProjectResource });
		await resourcesCollection.updateOne({
			_id: resourceObjectId
		}, {
			$set: { count }
		})

		res.status(200).json({ success: 'fake data berhasil di update' });



		/*
		
		// Mengubah resourceId menjadi ObjectId
		const resourceObjectId = new ObjectId(resourceId);

		await client.connect();
		const db = client.db(dbName);
		const resourcesCollection = db.collection('resources');



		const existingResource = await resourcesCollection.findOne({
			_id: resourceObjectId,
			projectId,
		});

		if (!existingResource) {
			return res.status(404).json({ message: 'Data tidak ditemukan' });
		}
		const projectResource = db.collection(`project-${projectId}`);

		try {
			const collections = await db.listCollections().toArray();
			const collectionNames = collections.map((col) => col.name);
			const existProjectResource = collectionNames.includes(`project-${projectId}`)



			const generated = generatorData(existingResource, count)

			if (existProjectResource) {
				const resource = await projectResource.find().toArray()
				const _id = resource[0]._id
				const result = resource[0]
				result[existingResource.endpoint] = generated[existingResource.endpoint]
				delete result._id


				await projectResource.updateOne({
					_id,
				},
					{ $set: result })

				res.status(200).json({ success: 'resources ada' });
			} else {



				//await projectResource.insertOne(generated)
				res.status(200).json({ success: 'oke' });
			}
		} catch (e) {
			console.log("error", e)
			res.status(500).json({ error: 'Terjadi kesalahan saat menyimpan fake data' });
		}



*/
	} catch (error) {
		console.error(error);
		res.status(500).json({ error: 'Terjadi kesalahan saat memperbarui data' });
	}
});

app.get('/projects', protectRoute, async (req, res) => {
	await client.connect();
	const db = client.db(dbName);
	const usersCollection = db.collection('projects');
	const projects = await usersCollection.find({ userId: req.userId }).toArray();
	res.status(200).json({ results: projects });
});


app.get('/api/:projectId/:endpoint', async (req, res) => {
	const { projectId, endpoint } = req.params

	try {
		await client.connect();
		const db = client.db(dbName);

		const resourcesProjectCollection = db.collection('resource-project');


		const existingProjectResource = await resourcesProjectCollection.findOne({
			projectId,
		});


		if (!existingProjectResource) {
			return res.status(404).json({ message: 'Data tidak ditemukan' });
		}

		const result = existingProjectResource[endpoint]

		if (!result) {
			return res.status(404).json({ errors: 'endpoint tidak ditemukan' });
		}
		res.status(200).json([...result]);


	} catch (error) {
		console.error(error);
		res.status(500).json({ error: 'Terjadi kesalahan saat memperbarui data' });
	}

});

app.get('/api/:projectId/:endpoint/:id', async (req, res) => {
	const { projectId, endpoint, id } = req.params

	try {
		await client.connect();
		const db = client.db(dbName);

		const resourcesProjectCollection = db.collection('resource-project');


		const existingProjectResource = await resourcesProjectCollection.findOne({
			projectId,
		});


		if (!existingProjectResource) {
			return res.status(404).json({ message: 'Data tidak ditemukan' });
		}

		const result = existingProjectResource[endpoint]
		const filterResult = result.filter(data => data.id === parseInt(id))

		if (!result) {
			return res.status(404).json({ errors: 'endpoint tidak ditemukan' });
		}
		if (filterResult.length === 0) {
			return res.status(404).json({ errors: 'data tidak ditemukan' });
		}
		res.status(200).json(filterResult[0]);

	} catch (error) {
		console.error(error);
		res.status(500).json({ error: 'Terjadi kesalahan saat memperbarui data' });
	}

});


app.get('/protected', protectRoute, (req, res) => {
	res.status(200).json({ message: 'Rute dilindungi', userId: req.userId });
});

app.get("/list-api", protectRoute, (req, res) => {
	const combinedArray = listApi.flatMap(item => item.subcategories.map(subcategory => `${item.category}.${subcategory}`));

	res.json({ listApi: combinedArray })
})


app.get('/verify', (req, res) => {
	const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2NTAzNzc5M2IxMzJjODZjNjcyNmJiNzAiLCJpYXQiOjE2OTQ3NTk5MDUsImV4cCI6MTY5NDg0NjMwNX0.tEJ4ZhbL0JTCdTRMp9-DRcojIn-yb4Y8pcxDg8Hxnmg"
	try {
		const decoded = jwt.verify(token, secretKey);
		req.userId = decoded.userId;
		res.status(200).json({ message: 'Rute dilindungi', decode: decoded });
	} catch (error) {
		res.status(401).json({ error: 'Akses ditolak. Token tidak valid.' });
	}

});

// Mulai server
const port = 3000; // Port yang Anda inginkan
app.listen(port, () => {
	console.log(`Server berjalan di http://localhost:${port}`);
});
