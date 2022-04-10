import { InputAdornment } from "@mui/material"
import InputContainer from "../../../components/input_container"
import InputBase from '../../../components/input_base'
import FormInstructions from "../../../components/form_instructions"
import FormContainer from "../../../components/form_container"

export default function ChargeAmountForm(props) {
  const { state, dispatch, sx, userToken, user } = props

  const handleBlur = (prop) => (e) => dispatch({ type: 'set', state: { focusedElement: null } })
  const handleFocus = (prop) => (e) => dispatch({ type: 'set', state: { focusedElement: prop } })
  const handleChange = (prop) => (e) => {
    let text = e.target.value
    text = text.split(',').join('')
    let number = Number(text)
    if (isNaN(number)) return //Require a number
    if (text.length > 6) return //String can't be longer than 6 characters
    if (text.indexOf('.') !== -1 && text.length > text.indexOf('.') + 3) //Limit to 2 decimal places
    
    if (text.indexOf('.') !== -1  ) {
      text = text.split('.')
      text[0] = text[0].split(',')
      text[0] = text[0].join('')
      text[0] = text[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",")
      text = text.join('.')
    } else {
      text = text.split(',')
      text = text.join('')
      text = text.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
    }

    if (number > 500) {
      dispatch({ type: 'set', state: { amount: {value: state.amount.value, error: {message: 'The max you can charge is $500'} } }})
    } else if (number < 3) {
      dispatch({ type: 'set', state: { amount: {value: text, error: {message: 'Amount must be greater than $3.00'}} } })
    } else {
      dispatch({ type: 'set', state: { amount: {value: text, error: null} } })
    }
  }

  return (
    <FormContainer>
      <FormInstructions>
        We recommend checking your card balance with the 
        card provider.  Charging more than the card's 
        balance will result in a declined payment.
      </FormInstructions>
      <InputContainer
        title='Charge Amount'
        error={state.amount.error}
        focused={state.focusedElement === 'amount'}
        width='200px'
        sx={sx}
      >
        <InputBase
          onChange={handleChange('amount')}
          onBlur={handleBlur('amount')}
          onFocus={handleFocus('amount')}
          value={state.amount.value}
          startAdornment={<InputAdornment position='start'>$</InputAdornment>}
        />
      </InputContainer>
    </FormContainer>
  )
}