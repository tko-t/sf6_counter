import Select from 'react-select';

export const CharaSelecter = (props) => {
  const { onChange, list, placeholder, defaultValue } = props

  console.log("defaultValue: ", defaultValue)
  return (
    <Select placeholder={placeholder} options={list} defaultValue={ { label: defaultValue } } onChange={ (selected) => onChange(selected.value) }/>
  )
}
