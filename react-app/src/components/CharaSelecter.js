import Select from 'react-select';

export const CharaSelecter = (props) => {
  const { onChange, list, placeholder, value } = props

  const selectedLabel = () => {
    if (!list) return {};

    return list.find( char => { if (char.value == value) return char }) || {}
  }

  const onChangeHandler = (selected) => {
    if (value !== selected.value) {
      onChange(selected.value)
    }
  }

  return (
    <Select placeholder={placeholder} options={list} value={ selectedLabel() } onChange={ (selected) => onChangeHandler(selected) }/>
  )
}
