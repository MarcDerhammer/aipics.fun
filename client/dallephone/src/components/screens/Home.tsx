import React, { useState } from 'react';
import { user, session } from '../../database/database';
import PromptInput from '../atoms/PromptInput';
import Quote from '../atoms/Quote';
import Polaroid from '../molecules/Polaroid';
import './Home.css';
import NavLink from '../atoms/NavLink';

const Home = () => {
  const [generating, setGenerating] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [imageId, setImageId] = useState([]);
  const [robotText, setRobotText] = useState('what would you like to see?');

  const generateImage = async (text: string) => {
    if (!text) {
      return;
    }
    if (generating) {
      return;
    }
    const token = session()?.access_token;
    setRobotText(`i am generating "${text}" ... just a moment`);
    setGenerating(true);
    try {
      setImageId([]);
      const response = await fetch(process.env.REACT_APP_BASE_URL || '', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          authorization: token || ''
        },
        body: JSON.stringify({
          text,
          num_images: 1
        })
      });
      if (response.status === 429) {
        setRobotText('you have reached the the anonymous limit! ' +
          'log in or come back later');
        setImageId([]);
        setGenerating(false);
        return;
      }
      if (response.status !== 200) {
        setRobotText(await response.text());
        setImageId([]);
        setGenerating(false);
        return;
      }

      const data = await response.json();

      setImageId(data.ids);
      setPrompt(data.text);
      setRobotText('what do you want to see next?');
    } catch (error) {
      setRobotText('there was a problem!');
      console.error(error);
      setImageId([]);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center'
    }}>
      <Quote authorComponent={'🤖'}
        text={robotText} />
      <PromptInput style={{
        marginTop: '15px',
        marginBottom: '15px'
      }} generating={generating}
        placeholder='a happy robot' onSubmit={(val) => {
          generateImage(val.trim());
        }} />
      <div style={{
        display: 'flex',
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center'
      }}>
        {
          imageId && imageId.length > 0 && imageId.map((id) => {
            return <Polaroid
              key={id}
              fadeInEffect={true}
              imageId={id}
              label={prompt}
              mode='grid'
              creator={{
                id: user()?.id || '',
                name: 'you'
              }}
              onDelete={() => {
                // filter out this Id from the list
                setImageId(imageId.filter((i) => i !== id));
              }} />;
          })
        }
      </div>
      {
        generating &&
        <h2 className="thinking">🤔</h2>
      }
      {
        imageId && imageId.length > 0 && (<div className="flash" />)
      }
      {
        !generating && !imageId && (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
          }}>
            <span>need inspiration?  check out the
              <NavLink to="/gallery" text="public gallery" /></span>
            <hr style={{
              marginTop: '30px',
              width: '100%'
            }} />
            <h3 style={{
              marginTop: '30px'
            }}>what is this?</h3>
            <span>this site uses&nbsp;
              <a rel="noreferrer"
                target="_blank"
                href="https://openai.com/dall-e-3">
                DALL·E 3</a>
              &nbsp;to convert text prompts into images</span>
            <span><br />by default, all images are private to you, but if
              you click the eyeball icon, they will be added to the public
              gallery</span>
          </div>
        )
      }
    </div>
  );
};

export default Home;
