import { useLocation, useNavigate } from "react-router-dom";
import { ChevronLeft, Zap } from "lucide-react";
import ActuationsArray from "./ActuationsArray";
import PageHeader from '../PageHeader';
import Button from '../Button';

const ActuationDetailPage = () => {
    const location = useLocation();
    const navigate = useNavigate();

    const { ScanArray, created_at, updated_at, email, make, model } = location.state || {};

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-fadeIn pb-12 px-6">
            <div className="flex justify-start pt-4">
                <Button 
                    variant="ghost" 
                    onClick={() => navigate(-1)}
                    icon={ChevronLeft}
                >
                    Return to Actuations
                </Button>
            </div>

            <PageHeader 
                title="Actuation Protocol Data" 
                subtitle={`Analyzing execution stream for ${make || 'Generic'} ${model || 'Vehicle'}`}
                icon={Zap}
            />

            <ActuationsArray 
                ActuationsArray={ScanArray || []} 
                created_at={created_at} 
                updated_at={updated_at} 
                email={email} 
                make={make} 
                model={model} 
            />
        </div>
    );
}

export default ActuationDetailPage;