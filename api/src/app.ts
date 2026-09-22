import express from 'express';
const PORT = 3000;

const app = express();
app.use(express.json());

app.listen(
    PORT,
    () => {
        console.log(`server is running on Port : ${PORT}`);
        console.log(`dashboard can be accessed on: https://safewaytransportaion.it.com/dashboard`);
        console.log(`swagger can be accessed on: https://safewaytransportaion.it.com/dashboard/api-docs`);
    }
);