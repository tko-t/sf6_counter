import Select from 'react-select';

export const CharaSelecter = (props) => {
  const { onChange, list, placeholder, value } = props

  const selectedLabel = () => {
    if (!list) return;

    const label = list.find( char => { if (char.value == value) return char })?.label

    if (label) return { label }

    return
  }

  return (
    <Select placeholder={placeholder} options={list} value={ selectedLabel() } onChange={ (selected) => onChange(selected.value) }/>
  )
}
