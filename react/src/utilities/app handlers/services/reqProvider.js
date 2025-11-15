import { preReqs } from "./preReq"
import { useNavigate } from "react-router-dom"

const ReqProvider = (props) => {

    preReqs(useNavigate)
    return (props.children)

}

export default ReqProvider