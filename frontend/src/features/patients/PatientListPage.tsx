import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Search,
  UserCheck,
  AlertCircle,
  Activity,
  ArrowUpRight,
  ShieldAlert,
  Phone,
  Droplet,
  FileText,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { getPatients } from '@/services/patientService';
import { Patient } from '@/types';
import { formatDate } from '@/lib/utils';

export const PatientListPage: React.FC = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPatients(searchTerm)
      .then((data) => setPatients(data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [searchTerm]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground">
            Patient Directory & Pharmacotherapy Profiles
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Registry of patients with baseline organ clearance metrics, active chronic conditions, and prescription risk trajectories.
          </p>
        </div>

        <Button asChild size="sm">
          <Link to="/analyze">
            <FileText className="mr-1.5 h-4 w-4" />
            Analyze Rx For Patient
          </Link>
        </Button>
      </div>

      {/* Search Input */}
      <Card className="border-border">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by patient ID, name, or medical condition (e.g. CKD, Diabetes)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 text-xs"
            />
          </div>
        </CardContent>
      </Card>

      {/* Patients Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {patients.map((p) => {
          const isCritical = p.risk_level === 'CRITICAL';
          const isHigh = p.risk_level === 'HIGH';
          return (
            <Card
              key={p.id}
              className="border-border hover:border-primary/40 transition-shadow shadow-sm flex flex-col justify-between"
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2.5">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 dark:bg-teal-950/60 text-primary font-bold text-sm">
                      {p.name.charAt(0)}
                    </div>
                    <div>
                      <CardTitle className="text-sm font-bold text-foreground">
                        {p.name}
                      </CardTitle>
                      <p className="text-[11px] text-muted-foreground font-mono">{p.id}</p>
                    </div>
                  </div>

                  <Badge variant={isCritical ? 'critical' : isHigh ? 'warning' : 'success'}>
                    {p.risk_level}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-3 text-xs">
                {/* Metrics */}
                <div className="grid grid-cols-3 gap-2 p-2.5 rounded-lg bg-muted/30 border border-border text-center">
                  <div>
                    <span className="text-[10px] text-muted-foreground block">Age/Sex</span>
                    <span className="font-semibold text-foreground">{p.age}y / {p.gender.charAt(0)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground block">eGFR</span>
                    <span className={`font-semibold ${p.egfr < 60 ? 'text-red-600' : 'text-foreground'}`}>
                      {p.egfr}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground block">HbA1c</span>
                    <span className={`font-semibold ${p.hba1c > 8.0 ? 'text-amber-600' : 'text-foreground'}`}>
                      {p.hba1c}%
                    </span>
                  </div>
                </div>

                {/* Conditions Tags */}
                <div>
                  <span className="text-[11px] font-semibold text-muted-foreground">Conditions:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {p.conditions.map((c, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] px-1.5 py-0.5 rounded bg-muted border border-border text-muted-foreground"
                      >
                        {c}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Allergies if any */}
                {p.allergies.length > 0 && (
                  <div className="text-[11px] text-red-600 dark:text-red-400">
                    <strong>Allergies: </strong>{p.allergies.join(', ')}
                  </div>
                )}

                <div className="pt-2 border-t border-border flex items-center justify-between">
                  <span className="text-[10px] text-muted-foreground">
                    Last evaluated: {formatDate(p.last_analyzed)}
                  </span>
                  <Button asChild size="sm" variant="ghost" className="h-7 px-2 text-xs text-primary">
                    <Link to={`/patients/${p.id}`}>
                      View Profile <ArrowUpRight className="ml-1 h-3 w-3" />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
