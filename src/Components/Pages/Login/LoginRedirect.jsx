import { Navigate, useLocation } from "react-router-dom";
import { buildLoginPath } from "../../../utils/loginRedirect";

function LoginRedirect() {
  const location = useLocation();
  return <Navigate to={buildLoginPath(location)} replace />;
}

export default LoginRedirect;
