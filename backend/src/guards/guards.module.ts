import { forwardRef, Module } from "@nestjs/common";
import { JwtAuthModule } from "src/auth/jwt/jwt-auth.module";
import { JwtGuard, JwtGuardWaiting2faCode } from "./jwt.guards";
import { JwtGatewayGuard } from "./jwtGateway.guards";

@Module({
	imports: [forwardRef(() => JwtAuthModule)],
	providers: [JwtGuard, JwtGuardWaiting2faCode, JwtGatewayGuard],
	exports: [JwtGuard, JwtGuardWaiting2faCode, JwtGatewayGuard],
})
export class JwtGuardsModule {}
