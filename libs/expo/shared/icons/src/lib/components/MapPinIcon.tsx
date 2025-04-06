import Svg, { Ellipse, G, Mask, Path, TSpan, Text } from 'react-native-svg';

type TWidthHeight = {
  width: string;
  height: string;
};

type TSize = 'S' | 'M' | 'L';

const sizeMap: Record<TSize, TWidthHeight> = {
  S: {
    width: '25',
    height: '36,',
  },
  M: {
    width: '48',
    height: '58,',
  },
  L: {
    width: '60',
    height: '85,',
  },
};

const fontSizeMap: Record<TSize, number> = {
  S: 14,
  M: 16,
  L: 20,
};

type TProps = {
  outlineColor?: string;
  fillColor?: string;
  text?: string;
  textColor?: string;
  shadowColor?: string;
  size?: TSize;
};

const MapPinIcon = (props: TProps) => {
  const {
    text,
    textColor = '#FFFFFF',
    outlineColor = '#CB0808',
    fillColor = '#FFFFFF',
    shadowColor = '#A8AEB8',
    size = 'L',
  } = props;

  return (
    <Svg {...sizeMap[size]} viewBox="0 0 40 58" fill="none">
      <G id="Map Pin">
        {/* Shadow ellipse */}
        <Ellipse
          id="shadow"
          cx="20.0026"
          cy="54.5676"
          rx="11.6667"
          ry="1.56757"
          fill={shadowColor}
        />
        <G id="Union">
          {/* Mask */}
          <Mask id="path-2-inside-1_176_3645" fill="white">
            <Path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M24.5714 37.128C33.4142 35.1833 40 27.7204 40 18.8108C40 8.42189 31.0457 0 20 0C8.9543 0 0 8.42189 0 18.8108C0 27.7204 6.58581 35.1833 15.4286 37.128L19.9993 50L24.5714 37.128Z"
            />
          </Mask>
          {/* Main shape fill */}
          <Path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M24.5714 37.128C33.4142 35.1833 40 27.7204 40 18.8108C40 8.42189 31.0457 0 20 0C8.9543 0 0 8.42189 0 18.8108C0 27.7204 6.58581 35.1833 15.4286 37.128L19.9993 50L24.5714 37.128Z"
            fill={fillColor}
          />
          {/* Outline path */}
          <Path
            d="M24.5714 37.128L24.1419 35.1747L23.0582 35.413L22.6868 36.4586L24.5714 37.128ZM15.4286 37.128L17.3133 36.4587L16.9419 35.413L15.8581 35.1747L15.4286 37.128ZM19.9993 50L18.1146 50.6693L19.9991 55.9761L21.884 50.6694L19.9993 50ZM38 18.8108C38 26.682 32.1682 33.4095 24.1419 35.1747L25.001 39.0813C34.6601 36.9571 42 28.7589 42 18.8108H38ZM20 2C30.0584 2 38 9.64019 38 18.8108H42C42 7.20359 32.033 -2 20 -2V2ZM2 18.8108C2 9.64019 9.94161 2 20 2V-2C7.967 -2 -2 7.20359 -2 18.8108H2ZM15.8581 35.1747C7.83176 33.4095 2 26.682 2 18.8108H-2C-2 28.7589 5.33987 36.9571 14.999 39.0813L15.8581 35.1747ZM21.884 49.3308L17.3133 36.4587L13.5439 37.7972L18.1146 50.6693L21.884 49.3308ZM22.6868 36.4586L18.1147 49.3306L21.884 50.6694L26.4561 37.7974L22.6868 36.4586Z"
            fill={outlineColor} // Change the outline color dynamically
            mask="url(#path-2-inside-1_176_3645)"
          />
        </G>

        {text && (
          // <Text
          //   x="50%"
          //   y="50%"
          //   // style={{tranfo}}
          //   textAnchor="middle"
          //   // alignmentBaseline="central" // Correct vertical centering
          //   // style={['transform': 'translateY(10)']}
          //   // style={[color: 'red']}
          //   // dy="-12"
          //   // style={{}}
          //   // transform={new CSSTranslate(y: 25)}
          //   // transform: 'translateY(10)'
          //   // verticalAlign=""
          //   alignmentBaseline="center"
          //   // dx="-.5em" // Slightly adjust vertical alignment
          //   fontSize={fontSizeMap[size]}
          //   fontWeight="bold"
          //   fill={textColor}
          // >
          //   {text}
          // </Text>
          <Text
            x="50%"
            y="50%"
            textAnchor="middle" // Ensures the text is horizontally centered
            // alignmentBaseline="middle" // Ensures the text is vertically centered (SVG text anchor property)
            // transform="matrix(1, 0, 0, 1, 0, -50)"
            fontWeight="bold"
            fill={textColor}
          >
            <TSpan fontSize={fontSizeMap[size]}>55</TSpan>
            <TSpan fontSize={12}>+</TSpan>
          </Text>
        )}
      </G>
    </Svg>
  );
};

export default MapPinIcon;

{
  /* <Text
              x="50%"
              y="50%"
              dy="-5%"
              textAnchor="middle"
              dx=".6em" // Slightly adjust vertical alignment
              // fontSize={fontSizeMap[size]}
              fontSize={12}
              fontWeight="bold"
              fill={textColor}
            >
              +
            </Text> */
}
