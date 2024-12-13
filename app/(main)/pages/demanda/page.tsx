'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Dropdown } from 'primereact/dropdown';
import { Button } from 'primereact/button';
import { Messages } from 'primereact/messages';
import { Calendar } from "primereact/calendar";

interface DropdownItem {
    name: string;
    code: string;
}

const DemandaPage = () => {
    const [dropdownItemMateria, setDropdownItemMateria] = useState<DropdownItem | null>(null);
    const [dropdownItemNacionalidad, setDropdownItemNacionalidad] = useState<DropdownItem | null>(null);
    const [dropdownItemEstadoCivil, setDropdownItemEstadoCivil] = useState<DropdownItem | null>(null);
    const [generatedButtons, setGeneratedButtons] = useState<DropdownItem[]>([]);
    const message = useRef<Messages>(null);
    const [calendarValue, setCalendarValue] = useState<any>(null);

    const dropdownItemsMateria: DropdownItem[] = useMemo(
        () => [
            { name: 'Asignación de colación', code: '1' },
            { name: 'Asignación  de experiencia', code: '2' },
            { name: 'Asignación de locomoción', code: '3' },
            { name: 'Asignación  de pérdida de caja', code: '4' },
            { name: 'Asignación de perfeccionamiento', code: '5' },
            { name: 'Asignación desgaste de harramientas', code: '6' },
            { name: 'Asignación Familia', code: '7' },
            { name: 'Asignaciónpor desempeño en cond. Difíciles', code: '8' },
            { name: 'Asignación por responsabilidad', code: '9' },
            { name: 'Asignacion especiales', code: '10' },
            { name: 'Bonos', code: '11' },
            { name: 'Comisiones', code: '12' },
            { name: 'Costas', code: '13' },
            { name: 'Cuota Sindical', code: '14' },
            { name: 'Daño Moral', code: '15' },
            { name: 'Descanso compensatorio', code: '16' },
            { name: 'Descanso dominical', code: '17' },
            { name: 'Despedido indirecto', code: '18' },
            { name: 'Despido Injustificado', code: '19' },
            { name: 'Feriado Legal', code: '20' },
            { name: 'Feriado Progresivo', code: '21' },
            { name: 'Feriado Proporcional', code: '22' },
            { name: 'Fuero maternal', code: '23' },
            { name: 'Fuero sindical', code: '24' },
            { name: 'Gratificaciones legales', code: '25' },
            { name: 'Horas Extras', code: '26' },
            { name: 'Indemnización convencional', code: '27' },
            { name: 'Indemnización de trabajadora de casa particular', code: '28' },
            { name: 'Indemnización del artículo 87 del Estatuto Docente', code: '29' },
            { name: 'Indemnización por años de servicios', code: '30' },
            { name: 'Indemnización sustitutiva de aviso previo', code: '31' },
            { name: 'Multa', code: '32' },
            { name: 'Nulidad de despido', code: '33' },
            { name: 'Otras Gratificaciones', code: '34' },
            { name: 'Otras Indemnizaciones', code: '35' },
            { name: 'Participación', code: '36' },
            { name: 'Prestaciones', code: '37' },
            { name: 'Recálculo de pensiones', code: '38' },
            { name: 'Recargos', code: '39' },
            { name: 'Regalías', code: '40' },
            { name: 'Reincorporación', code: '41' },
            { name: 'Remuneraciones', code: '42' },
            { name: 'Semana corrida', code: '43' },
            { name: 'Subterfugio', code: '44' },
            { name: 'Sueldo', code: '45' },
            { name: 'Trato', code: '46' },
            { name: 'Viáticos', code: '47' },
            { name: 'Desafuero Maternal', code: '48' },
            { name: 'Desafuero Sindical', code: '49' },
            { name: 'Art. 19 N° 12 CPR. Libertad de opinión e información', code: '50' },
            { name: 'Otras Materias Sindicales', code: '51' },
            { name: 'Art. 19 N° 1 Derecho a la vida y la integridad', code: '52' },
            { name: 'Art. 19 N° 16 CPR. Libertad de Trabajo y su protección', code: '53' },
            { name: 'Art. 19 N° 4 Vida Privada y Honra', code: '54' },
            { name: 'Art. 19 N° 5 Inviolabilidad de la comunicación privada', code: '55' },
            { name: 'Art. 19 N° 6 CPR. Libertad de creencias', code: '56' },
            { name: 'Art. 2 CT. Sobre actos de discriminación', code: '56' },
            { name: 'Art. 485 inciso 3° CT', code: '56' },
            { name: 'Accidentes Del Trabajo Y Enfermedades Profesionales', code: '56' }
        ],
        []
    );

    const dropdownItemsNacionalidades: DropdownItem[] = useMemo(
        () => [
            { name: 'Afgana', code: 'AF' },
            { name: 'Alemana', code: 'DE' },
            { name: 'Andorrana', code: 'AD' },
            { name: 'Angoleña', code: 'AO' },
            { name: 'Argentina', code: 'AR' },
            { name: 'Armenia', code: 'AM' },
            { name: 'Australiana', code: 'AU' },
            { name: 'Austriaca', code: 'AT' },
            { name: 'Bangladesí', code: 'BD' },
            { name: 'Belga', code: 'BE' },
            { name: 'Boliviana', code: 'BO' },
            { name: 'Brasileña', code: 'BR' },
            { name: 'Búlgara', code: 'BG' },
            { name: 'Canadiense', code: 'CA' },
            { name: 'Chilena', code: 'CL' },
            { name: 'China', code: 'CN' },
            { name: 'Colombiana', code: 'CO' },
            { name: 'Coreana', code: 'KR' },
            { name: 'Costarricense', code: 'CR' },
            { name: 'Cubana', code: 'CU' },
            { name: 'Danesa', code: 'DK' },
            { name: 'Dominicana', code: 'DO' },
            { name: 'Ecuatoriana', code: 'EC' },
            { name: 'Egipcia', code: 'EG' },
            { name: 'Española', code: 'ES' },
            { name: 'Estadounidense', code: 'US' },
            { name: 'Etíope', code: 'ET' },
            { name: 'Filipina', code: 'PH' },
            { name: 'Francesa', code: 'FR' },
            { name: 'Griega', code: 'GR' },
            { name: 'Guatemalteca', code: 'GT' },
            { name: 'Hondureña', code: 'HN' },
            { name: 'India', code: 'IN' },
            { name: 'Indonesa', code: 'ID' },
            { name: 'Irlandesa', code: 'IE' },
            { name: 'Israelí', code: 'IL' },
            { name: 'Italiana', code: 'IT' },
            { name: 'Japonesa', code: 'JP' },
            { name: 'Marroquí', code: 'MA' },
            { name: 'Mexicana', code: 'MX' },
            { name: 'Nicaragüense', code: 'NI' },
            { name: 'Neozelandesa', code: 'NZ' },
            { name: 'Noruega', code: 'NO' },
            { name: 'Panameña', code: 'PA' },
            { name: 'Paraguaya', code: 'PY' },
            { name: 'Peruana', code: 'PE' },
            { name: 'Polaca', code: 'PL' },
            { name: 'Portuguesa', code: 'PT' },
            { name: 'Rumana', code: 'RO' },
            { name: 'Rusa', code: 'RU' },
            { name: 'Salvadoreña', code: 'SV' },
            { name: 'Sudafricana', code: 'ZA' },
            { name: 'Sueca', code: 'SE' },
            { name: 'Suiza', code: 'CH' },
            { name: 'Tailandesa', code: 'TH' },
            { name: 'Turca', code: 'TR' },
            { name: 'Uruguaya', code: 'UY' },
            { name: 'Venezolana', code: 'VE' },
            { name: 'Vietnamita', code: 'VN' },
        ],
        []
    );

    const dropdownItemsEstadoCivil: DropdownItem[] = useMemo(
        () => [
            { name: 'Solerto(a)', code: '1' },
            { name: 'Casado(a)', code: '2' },
            { name: 'Conviviente civil', code: '3' },
            { name: 'Separado(a) judicialmente', code: '4' },
            { name: 'Divorciado(a)', code: '5' },
            { name: 'Viudo(a)', code: '6' }
        ],
        []
    );

    /* useEffect(() => {
        setDropdownItem(dropdownItemsMateria[0]);
    }, [dropdownItemsMateria]); */

    const addErrorMessage = () => {
        message.current?.show({ severity: 'error', content: 'Esta materia ya ha sido agregada.' });
    };

    const handleAddButton = () => {
        if (dropdownItemMateria) {
            // Verificar si la materia ya existe en los botones generados
            const alreadyExists = generatedButtons.some(
                (button) => button.code === dropdownItemMateria.code
            );

            if (alreadyExists) {
                addErrorMessage();
                return; // Salir sin agregar el botón
            }

            // Agregar la materia al estado si no existe
            setGeneratedButtons((prev) => [
                ...prev,
                { name: dropdownItemMateria.name, code: dropdownItemMateria.code },
            ]);
        }
    };

    const handleRemoveButton = (code: string) => {
        setGeneratedButtons((prev) =>
            prev.filter((button) => button.code !== code)
        );
    };

    return (
        <div className="grid">
            <div className="col-12">
                <div className="card">
                    <h5>DATOS CLIENTE</h5>
                    <div className="p-fluid formgrid grid">
                        <div className="field col-12 md:col-4">
                            <label htmlFor="nombres">Nombres</label>
                            <InputText
                                id="nombres"
                                type="text"
                                placeholder='Ingrese los nombres' />
                        </div>
                        <div className="field col-12 md:col-4">
                            <label htmlFor="apPaterno">Apellido Paterno</label>
                            <InputText
                                id="apPaterno"
                                type="text"
                                placeholder='Ingrese apellido paterno' />
                        </div>
                        <div className="field col-12 md:col-4">
                            <label htmlFor="apMaterno">Apellido Materno</label>
                            <InputText
                                id="apMaterno"
                                type="text"
                                placeholder='Ingrese apellido materno' />
                        </div>
                        <div className="field col-12 md:col-4">
                            <label htmlFor="run">Rut/Pasaporte/Cédula</label>
                            <InputText
                                id="run"
                                type="text"
                                placeholder='Ingrese Rut/Pasaporte/Cédula' />
                        </div>
                        <div className="field col-12 md:col-4">
                            <label htmlFor="nacionalidad">Nacionalidad</label>
                            <Dropdown
                                id="nacionalidad"
                                value={dropdownItemNacionalidad}
                                onChange={(e) => setDropdownItemNacionalidad(e.value)}
                                options={dropdownItemsNacionalidades}
                                optionLabel="name"
                                placeholder="Selecccione Nacionalidad"
                                filter></Dropdown>
                        </div>
                        <div className="field col-12 md:col-4">
                            <label htmlFor="estadoCivil">Estado Civil</label>
                            <Dropdown
                                id="estadoCivil"
                                value={dropdownItemEstadoCivil}
                                onChange={(e) => setDropdownItemEstadoCivil(e.value)}
                                options={dropdownItemsEstadoCivil}
                                optionLabel="name"
                                placeholder="Selecccione Estado Civil">
                            </Dropdown>
                        </div>
                        <div className="field col-12 md:col-4">
                            <label htmlFor="nacimiento">Fecha de Nacimiento</label>
                            <Calendar
                                showIcon
                                showButtonBar
                                value={calendarValue}
                                dateFormat='dd/mm/yy'
                                onChange={(e) => setCalendarValue(e.value ?? null)}
                                placeholder='dd/mm/yyyy'
                                locale='es' />
                        </div>
                        <div className="field col-12 md:col-6">
                            <label htmlFor="run">Correo Electrónico</label>
                            <InputText
                                id="run"
                                type="text"
                                placeholder='ejemplo@direccion.cl' />
                        </div>
                    </div>
                </div>

                {/* <div className="card">
                    <h5>DATOS DEMANDADO PRINCIPAL</h5>
                    <div className="p-fluid formgrid grid">
                        <div className="field col-12 md:col-4">
                            <label htmlFor="nombreRazonSocial">Nombre Razón Social de Empresa</label>
                            <InputText 
                                id="nombreRazonSocial" 
                                type="text" 
                                placeholder='Ingrese el Nombre Razón Social de Empresa'/>
                        </div>
                        <div className="field col-12 md:col-4">
                            <label htmlFor="rutRazonSocial">Rut</label>
                            <InputText 
                                id="rutRazonSocial" 
                                type="text" 
                                placeholder='Ingrese rut'/>
                        </div>
                        <div className="field col-12 md:col-4">
                            <label htmlFor="domicilioRazonSocial">Domicilio</label>
                            <InputText 
                                id="domicilioRazonSocial" 
                                type="text" 
                                placeholder='Ingrese domicilio'/>
                        </div>
                        <div className="field col-12 md:col-4">
                            <label htmlFor="representanteLegal">Representante Legal</label>
                            <InputText 
                                id="representanteLegal" 
                                type="text" 
                                placeholder='Ingrese nombre del representante legal'/>
                        </div>
                        <div className="field col-12 md:col-4">
                            <label htmlFor="run">Rut Representante Legal</label>
                            <InputText 
                                id="run" 
                                type="text" 
                                placeholder='Ingrese Rut del representante legal'/>
                        </div>
                    </div>
                </div> */}
                <div className="card">
                    <h5>INGRESO DE DEMANDA</h5>
                    <div className="p-fluid formgrid grid">
                        <div className="field col-12 md:col-6">
                            <label htmlFor="materia">Materia</label>
                            <Dropdown
                                id="materia"
                                value={dropdownItemMateria}
                                onChange={(e) => setDropdownItemMateria(e.value)}
                                options={dropdownItemsMateria}
                                optionLabel="name"
                                placeholder="Selecccione Materia"
                                filter></Dropdown>
                        </div>
                        <div className="field col-6 md:col-3">
                            <label htmlFor="addmateria" style={{ color: "#fff" }}>.</label>
                            <Button
                                id="addmateria"
                                label="Agregar"
                                icon="pi pi-plus"
                                severity="success"
                                onClick={handleAddButton}></Button>
                        </div>
                        <Messages ref={message} />
                    </div>
                </div>
                <div className="card">
                    <h5>MATERIAS SELECCIONADA</h5>
                    <div className="flex flex-wrap gap-2">
                        {generatedButtons.map((button) => (
                            <Button
                                key={button.code}
                                label={button.name}
                                severity="info"
                                className="p-mr-2 p-mb-2"
                                onClick={() => handleRemoveButton(button.code)}
                            />
                        ))}
                    </div>
                </div>

            </div>
            <div className="col-12 md:col-6">
                <div className="card p-fluid">
                    <h5>DATOS DEMANDADO PRINCIPAL</h5>
                    <div className="field">
                        <label htmlFor="nombreRazonSocial">Nombre Razón Social de Empresa</label>
                        <InputText
                            id="nombreRazonSocial"
                            type="text"
                            placeholder='Ingrese el Nombre Razón Social de Empresa' />
                    </div>
                    <div className="field">
                        <label htmlFor="rutRazonSocial">Rut</label>
                        <InputText
                            id="rutRazonSocial"
                            type="text"
                            placeholder='Ingrese rut' />
                    </div>
                    <div className="field">
                        <label htmlFor="domicilioRazonSocial">Domicilio</label>
                        <InputText
                            id="domicilioRazonSocial"
                            type="text"
                            placeholder='Ingrese domicilio' />
                    </div>
                    <div className="field">
                        <label htmlFor="representanteLegal">Representante Legal</label>
                        <InputText
                            id="representanteLegal"
                            type="text"
                            placeholder='Ingrese nombre del representante legal' />
                    </div>
                    <div className="field">
                        <label htmlFor="run">Rut Representante Legal</label>
                        <InputText
                            id="run"
                            type="text"
                            placeholder='Ingrese Rut del representante legal' />
                    </div>
                </div>
            </div>
            <div className="col-12 md:col-6">
                <div className="card p-fluid">
                    <h5>Vertical</h5>
                    <div className="field">
                        <label htmlFor="name1">Name</label>
                        <InputText id="name1" type="text" />
                    </div>
                    <div className="field">
                        <label htmlFor="email1">Email</label>
                        <InputText id="email1" type="text" />
                    </div>
                    <div className="field">
                        <label htmlFor="age1">Age</label>
                        <InputText id="age1" type="text" />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DemandaPage;
