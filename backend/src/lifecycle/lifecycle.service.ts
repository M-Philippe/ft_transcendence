import { Injectable, OnApplicationShutdown } from "@nestjs/common";

@Injectable()
export class LifecycleService implements OnApplicationShutdown {
  onApplicationShutdown(signal: string) {

	// TO SAVE DB
    // const { exec } = require("child_process");
    // exec("npm run save:db", (error: any, stdout: any, stderr: any) => {
    //   if (error) {
    //     console.log(`error: ${error.message}`);
    //     return;
    //   }
    //   if (stderr) {
    //     console.log(`stderr: ${stderr}`)
    //   }
    //   console.log(`stdout: ${stdout}`)
    // })


    // exec("rm -rf dist");
  }
}
