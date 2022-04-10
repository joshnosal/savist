import { CardExpiryElement, CardCvcElement, CardNumberElement } from "@stripe/react-stripe-js"
import InputContainer from "../../../components/input_container"
import FormContainer from "../../../components/form_container"
import { Box } from "@mui/material"

export default function CardDetails(props) {
  const { state, dispatch, sx, userToken, user } = props
  const cardElements = [
    {type: 'cardNumber', title: 'Card Number', width: '340px'},
    {type: 'cardExpiry', title: 'Expiration', width: '160px'},
    {type: 'cardCvc', title: 'CVC', width: '160px'},
  ]

  const handleFocus = (e) => dispatch({ type: 'set', state: { focusedElement: e.elementType } })
  const handleBlur = (e) => dispatch({ type: 'set', state: { focusedElement: null } })
  const handleChange = (e) => dispatch({ type: 'set', state: { [e.elementType]: { value: e.complete, error: e.error } } })

  const getCardElement = (type) => {
    switch(type) {
      case 'cardNumber': 
        return <CardNumberElement options={{ style: sx.card }} onChange={handleChange} onFocus={handleFocus} onBlur={handleBlur}/>
      case 'cardExpiry':
        return <CardExpiryElement options={{ style: sx.card }} onChange={handleChange} onFocus={handleFocus} onBlur={handleBlur}/>
      default:
        return <CardCvcElement options={{ style: sx.card }} onChange={handleChange} onFocus={handleFocus} onBlur={handleBlur}/>
    }
  }

  return(
    <FormContainer>
      {cardElements.map((element, idx) => (
        <InputContainer
          key={idx}
          width={element.width}
          focused={state.focusedElement === element.type}
          error={state[element.type].error}
          title={element.title}
          sx={sx}
        >
          <Box sx={{ padding: '5px 0' }}>
            {getCardElement(element.type)}
          </Box>
        </InputContainer>
      ))}
    </FormContainer>
  )
}

