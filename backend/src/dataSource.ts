import { DataSource } from "typeorm";
import { Chat } from "./chat/entities/chat.entity";
import { Match } from "./matches/entities/match.entity";
import { Relationship } from "./relationships/entities/relationship.entity";
import { User } from "./users/entities/user.entity";

export const PostgresDataSource = new DataSource({
    type: "postgres",
    host: "host.docker.internal",
    port: 5432,
    username: "user",
    password: "password",
    database: "database",
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
        console.error("Error during Data Source initialization", err)
    })