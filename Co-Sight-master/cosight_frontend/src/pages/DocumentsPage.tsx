import { Navigate } from 'react-router-dom';

/** 合同文书已并入智能工作台 intake，旧链接重定向。 */
function DocumentsPage() {
  return <Navigate to="/workspace" replace />;
}

export default DocumentsPage;
