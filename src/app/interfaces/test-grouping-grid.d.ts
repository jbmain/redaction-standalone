export interface IConfigurationGroup {
    id: number;
    label: string;
    data: IConfigurationGroupData;
}

export interface IConfigurationGroupData {
    label: string;
    name: string;
}