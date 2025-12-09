import { Link } from "react-router";


const WilayaCard = ({number, value, numberOfClients}) => {
  return (
    <Link to={`/clients/wilayas/${number}`}>
      <div className="card flex flex-col gap-2">
        <p className="card-title">{number} - {value}</p>
        <p className="card-subtitle">{numberOfClients} clients</p>
      </div>

    </Link>
  )
}

export default WilayaCard;