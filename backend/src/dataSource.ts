import { DataSource } from "typeorm";
import { Chat } from "./chat/entities/chat.entity";
import { Match } from "./matches/entities/match.entity";
import { Relationship } from "./relationships/entities/relationship.entity";
import { User } from "./users/entities/user.entity";

export const PostgresDataSource = new DataSource({
    type: "postgres",
    host: process.env.TYPEORM_HOST,
    port: process.env.TYPEORM_PORT !== undefined ? parseInt(process.env.TYPEORM_PORT): 5432,
    username: process.env.TYPEORM_USERNAME,
    password: process.env.TYPEORM_PASSWORD,
    database: process.env.TYPEORM_DATABASE,
    entities: [
        Chat,
        Match,
        Relationship,
        User,
        // ....
    ],
})

PostgresDataSource.initialize()
    .then(() => {
        console.log("Data Source has been initialized!")
    })
    .catch((err) => {
        //console.error("Error during Data Source initialization", err)
    })